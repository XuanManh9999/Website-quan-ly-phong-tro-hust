package com.hust.roomrental.controller;

import com.hust.roomrental.config.AppProperties;
import com.hust.roomrental.dto.chat.ChatRequest;
import com.hust.roomrental.dto.listing.ListingResponse;
import com.hust.roomrental.service.ChatService;
import com.hust.roomrental.service.ListingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
public class ChatController {

    private final ChatService chatService;
    private final AppProperties appProperties;
    private final ListingService listingService;

    /**
     * Mở rộng nội dung nút gợi ý (front-end gửi {@code __q:id} để tiết kiệm token).
     * Thứ tự phải khớp {@code SUGGESTIONS} trong {@code RoomSearchChatbot.jsx}.
     */
    private static final String[] QUICK_EXPANDED = new String[] {
            """
                    Tôi đang tìm phòng trọ đã duyệt trên hệ thống, ngân sách dưới 3 triệu đồng/tháng.
                    Hãy gợi ý cách lọc (khu vực, diện tích, tiện ích), lưu ý sinh viên và cách đọc thẻ phòng gợi ý bên dưới.
                    """.strip(),
            """
                    Tôi cần thuê phòng ở Hà Nội, ưu tiên các quận có đông sinh viên và thuận tiện đi học gần HUST.
                    Hãy tư vấn khu vực phù hợp, mức giá tham khảo và checklist an toàn khi đi xem phòng.
                    """.strip(),
            """
                    Hãy so sánh ngắn gọn phòng trọ và chung cư mini trên góc nhìn sinh viên: chi phí, không gian, giờ giấc, tiện ích, rủi ro thường gặp.
                    Không chèn ép một lựa chọn; kết thúc bằng gợi ý cách chọn theo nhu cầu cá nhân.
                    """.strip(),
            """
                    Tôi muốn biết làm sao để xem số điện thoại / liên hệ chủ trọ trên hệ thống.
                    Hãy giải thích theo luồng thực tế: đăng nhập, mở trang chi tiết phòng, và lưu ý không chia sẻ công khai thông tin cá nhân chủ trọ.
                    """.strip()
    };

    // Rate limit đơn giản theo IP (MVP). Reset theo ngày.
    private static final ConcurrentHashMap<String, DayBucket> BUCKETS = new ConcurrentHashMap<>();

    @GetMapping("/status")
    public Map<String, Object> status() {
        String key = appProperties.getGemini().getApiKey();
        return Map.of("enabled", key != null && !key.isBlank());
    }

    @PostMapping
    public Map<String, Object> chat(
            @RequestHeader(value = "X-Forwarded-For", required = false) String xff,
            @RequestHeader(value = "X-Real-IP", required = false) String xRealIp,
            HttpServletRequest httpRequest,
            @Valid @RequestBody CompatibilityChatRequest request
    ) {
        String ip = clientIp(xff, xRealIp, httpRequest);
        if (!allowRequest(ip)) {
            throw new com.hust.roomrental.exception.ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "RATE_LIMIT",
                    "Bạn đã dùng quá số lượt chatbot trong ngày. Vui lòng thử lại sau."
            );
        }
        List<Message> messages = request.messages() == null ? List.of() : request.messages();
        String lastRaw = "";
        for (int i = messages.size() - 1; i >= 0; i--) {
            Message m = messages.get(i);
            if ("user".equalsIgnoreCase(m.role()) && m.content() != null && !m.content().isBlank()) {
                lastRaw = m.content().trim();
                break;
            }
        }
        if (lastRaw.isBlank()) {
            return Map.of("reply", "Bạn hãy nhập câu hỏi để mình hỗ trợ tìm phòng.", "rooms", List.of());
        }
        int maxChars = Math.max(200, appProperties.getChat().getMaxMessageChars());
        String expanded = expandQuickPrompt(lastRaw);
        if (expanded.length() > maxChars) {
            expanded = expanded.substring(0, maxChars);
        }

        var rooms = suggestRooms(expanded);
        String listingsContext = truncate(formatListingsForModel(rooms), 8000);
        String historyDigest = truncate(buildConversationDigest(messages), 6000);

        var reply = chatService.chat(new ChatRequest(
                expanded,
                null,
                listingsContext,
                historyDigest
        ));
        return Map.of("reply", reply.reply(), "rooms", rooms);
    }

    public record CompatibilityChatRequest(List<Message> messages, String clientOrigin) {}
    public record Message(@NotBlank String role, @NotBlank String content) {}

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, Math.max(0, max - 2)) + "…";
    }

    private static final Pattern QUICK_TOKEN = Pattern.compile("^__q:(\\d+)$");

    private String expandQuickPrompt(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.trim();
        var m = QUICK_TOKEN.matcher(t);
        if (m.matches()) {
            int id = Integer.parseInt(m.group(1));
            if (id >= 0 && id < QUICK_EXPANDED.length) {
                return QUICK_EXPANDED[id];
            }
        }
        return t;
    }

    private String buildConversationDigest(List<Message> messages) {
        int lastUserIdx = -1;
        for (int i = messages.size() - 1; i >= 0; i--) {
            Message msg = messages.get(i);
            if ("user".equalsIgnoreCase(msg.role()) && msg.content() != null && !msg.content().isBlank()) {
                lastUserIdx = i;
                break;
            }
        }
        if (lastUserIdx <= 0) {
            return null;
        }
        int budget = Math.max(400, appProperties.getChat().getMaxHistoryChars());
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lastUserIdx; i++) {
            Message msg = messages.get(i);
            String roleLabel = "user".equalsIgnoreCase(msg.role()) ? "Người dùng" : "Trợ lý";
            String content = expandQuickPrompt(msg.content().trim());
            if ("assistant".equalsIgnoreCase(msg.role()) && content.length() > 900) {
                content = content.substring(0, 900) + "…";
            }
            String line = roleLabel + ": " + content + "\n";
            if (sb.length() + line.length() > budget) {
                break;
            }
            sb.append(line);
        }
        return sb.isEmpty() ? null : sb.toString();
    }

    private String formatListingsForModel(List<Map<String, Object>> rooms) {
        if (rooms == null || rooms.isEmpty()) {
            return "(Không có phòng trong gói gợi ý tự động cho truy vấn này.)";
        }
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> r : rooms) {
            Object id = r.get("id");
            Object title = r.get("title");
            Object price = r.get("priceMonthly");
            Object area = r.get("areaM2");
            Object district = r.get("district");
            Object ward = r.get("ward");
            Object province = r.get("province");
            sb.append("- id=").append(id)
                    .append(" | ").append(title)
                    .append(" | giá/tháng=").append(price)
                    .append(" | diện tích m²=").append(area)
                    .append(" | quận=").append(district)
                    .append(" | phường=").append(ward)
                    .append(" | tỉnh/tp=").append(province)
                    .append("\n");
        }
        return sb.toString().trim();
    }

    private List<Map<String, Object>> suggestRooms(String text) {
        PriceRange pr = parsePriceRange(text);
        String district = parseDistrict(text);
        String q = text != null && text.length() > 120 ? text.substring(0, 120) : text;
        var page = listingService.searchPublic(
                district,
                null,
                null,
                q != null && !q.isBlank() ? q : null,
                pr.min(),
                pr.max(),
                null,
                null,
                null,
                PageRequest.of(0, 6)
        );
        return page.content().stream().map(this::suggestRoomFromListing).toList();
    }

    private Map<String, Object> suggestRoomFromListing(ListingResponse r) {
        String cover = (r.images() != null && !r.images().isEmpty()) ? r.images().get(0).url() : null;
        AddrParts addr = splitAddress(r.address());
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", r.id());
        m.put("title", r.title());
        m.put("roomType", "phong_tro");
        m.put("province", addr.province());
        m.put("district", r.district() != null && !r.district().isBlank() ? r.district() : addr.district());
        m.put("ward", addr.ward());
        m.put("priceMonthly", r.price());
        m.put("areaM2", r.areaM2());
        m.put("coverImageUrl", cover);
        return m;
    }

    private PriceRange parsePriceRange(String text) {
        if (text == null) return new PriceRange(null, null);
        String t = text.toLowerCase();
        java.util.regex.Matcher range = java.util.regex.Pattern
                .compile("(\\d+(?:[\\.,]\\d+)?)\\s*(?:-|đến|to)\\s*(\\d+(?:[\\.,]\\d+)?)\\s*triệu")
                .matcher(t);
        if (range.find()) {
            Double a = parseMillion(range.group(1));
            Double b = parseMillion(range.group(2));
            if (a != null && b != null) {
                double min = Math.min(a, b) * 1_000_000d;
                double max = Math.max(a, b) * 1_000_000d;
                return new PriceRange(java.math.BigDecimal.valueOf(min), java.math.BigDecimal.valueOf(max));
            }
        }

        java.util.regex.Matcher under = java.util.regex.Pattern.compile("dưới\\s*(\\d+(?:[\\.,]\\d+)?)\\s*triệu").matcher(t);
        if (under.find()) {
            Double m = parseMillion(under.group(1));
            if (m != null) return new PriceRange(null, java.math.BigDecimal.valueOf(m * 1_000_000d));
        }

        java.util.regex.Matcher over = java.util.regex.Pattern.compile("(?:trên|từ)\\s*(\\d+(?:[\\.,]\\d+)?)\\s*triệu").matcher(t);
        if (over.find()) {
            Double m = parseMillion(over.group(1));
            if (m != null) return new PriceRange(java.math.BigDecimal.valueOf(m * 1_000_000d), null);
        }
        return new PriceRange(null, null);
    }

    private Double parseMillion(String token) {
        try {
            return Double.parseDouble(token.replace(",", ".").trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private String parseDistrict(String text) {
        if (text == null) return null;
        String t = text.toLowerCase();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(quận\\s*\\d+|quận\\s*[a-zà-ỹ0-9\\s]+|huyện\\s*[a-zà-ỹ0-9\\s]+)").matcher(t);
        if (m.find()) {
            String raw = m.group(1).trim().replaceAll("\\s{2,}", " ");
            return Character.toUpperCase(raw.charAt(0)) + raw.substring(1);
        }
        return null;
    }

    private AddrParts splitAddress(String address) {
        if (address == null || address.isBlank()) return new AddrParts(null, null, null);
        java.util.List<String> parts = java.util.Arrays.stream(address.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
        if (parts.isEmpty()) return new AddrParts(null, null, null);
        String province = parts.size() >= 1 ? parts.get(parts.size() - 1) : null;
        String district = parts.size() >= 2 ? parts.get(parts.size() - 2) : null;
        String ward = parts.size() >= 3 ? parts.get(parts.size() - 3) : null;
        return new AddrParts(ward, district, province);
    }

    private record AddrParts(String ward, String district, String province) {}
    private record PriceRange(java.math.BigDecimal min, java.math.BigDecimal max) {}

    private boolean allowRequest(String ip) {
        String day = java.time.LocalDate.now().toString();
        DayBucket b = BUCKETS.compute(ip, (k, old) -> {
            if (old == null || !day.equals(old.day)) return new DayBucket(day, new AtomicInteger(0));
            return old;
        });
        // cleanup nhẹ: nếu map phình, xoá ngẫu nhiên các bucket cũ (best-effort)
        if (BUCKETS.size() > 50_000) {
            BUCKETS.entrySet().removeIf(e -> !day.equals(e.getValue().day));
        }
        int limit = Math.max(5, appProperties.getChat().getMaxRequestsPerIpPerDay());
        return b.count.incrementAndGet() <= limit;
    }

    private String clientIp(String xff, String xRealIp, HttpServletRequest request) {
        String raw = (xff != null && !xff.isBlank()) ? xff : xRealIp;
        if (raw == null || raw.isBlank()) {
            raw = request != null ? request.getRemoteAddr() : null;
        }
        if (raw == null || raw.isBlank()) return "unknown";
        // X-Forwarded-For: client, proxy1, proxy2...
        String first = raw.split(",")[0].trim();
        return first.isBlank() ? "unknown" : first;
    }

    private record DayBucket(String day, AtomicInteger count) {}
}
