package com.hust.roomrental.integration.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.roomrental.config.AppProperties;
import com.hust.roomrental.dto.chat.ChatRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private static final String NO_KEY_REPLY = """
            Hiện trợ lý AI chưa được cấu hình trên máy chủ (thiếu khóa API).
            Bạn vẫn có thể xem các thẻ phòng gợi ý ngay dưới khung chat (nếu có) hoặc mở mục Danh sách phòng để lọc theo giá và khu vực.
            """.trim();

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder().build();

    public String generateReply(ChatRequest request) {
        String key = appProperties.getGemini().getApiKey();
        if (key == null || key.isBlank()) {
            return NO_KEY_REPLY;
        }
        String model = appProperties.getGemini().getModel();
        String base = appProperties.getGemini().getApiUrl().replaceAll("/$", "");
        String url = base + "/" + model + ":generateContent?key=" + key;

        String userBlob = buildUserBlob(request);
        int maxTotal = Math.max(4_000, appProperties.getChat().getMaxTotalPromptChars());
        if (userBlob.length() > maxTotal) {
            userBlob = userBlob.substring(0, maxTotal) + "\n\n[... Nội dung đã được rút gọn để an toàn kích thước yêu cầu.]";
        }

        Map<String, Object> systemInstruction = Map.of(
                "parts", List.of(Map.of("text", AssistantSystemPrompt.VI.trim()))
        );

        Map<String, Object> userTurn = new LinkedHashMap<>();
        userTurn.put("role", "user");
        userTurn.put("parts", List.of(Map.of("text", userBlob)));

        Map<String, Object> genConfig = new LinkedHashMap<>();
        genConfig.put("temperature", appProperties.getGemini().getTemperature());
        genConfig.put("maxOutputTokens", appProperties.getGemini().getMaxOutputTokens());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", systemInstruction);
        body.put("contents", List.of(userTurn));
        body.put("generationConfig", genConfig);

        try {
            String raw = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = objectMapper.readTree(raw);

            JsonNode blockReason = root.path("promptFeedback").path("blockReason");
            if (!blockReason.isMissingNode() && !blockReason.asText().isBlank()) {
                log.warn("Gemini prompt blocked: {}", blockReason.asText());
                return "Nội dung không thể xử lý tự động (bộ lọc an toàn). Bạn hãy diễn đạt lại ngắn gọn, hoặc xem phòng gợi ý bên dưới.";
            }

            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                log.warn("Gemini empty candidates: {}", raw);
                return "Không nhận được phản hồi từ AI. Bạn thử lại sau hoặc xem danh sách phòng trực tiếp.";
            }

            JsonNode first = candidates.path(0);
            String finish = first.path("finishReason").asText("");
            if ("SAFETY".equalsIgnoreCase(finish) || "BLOCKLIST".equalsIgnoreCase(finish)
                    || "PROHIBITED_CONTENT".equalsIgnoreCase(finish)) {
                return "Trợ lý không thể trả lời câu hỏi này theo chính sách an toàn. Bạn hãy đổi cách hỏi (tập trung vào tìm phòng, giá, khu vực) hoặc xem phòng gợi ý bên dưới.";
            }

            JsonNode text = first.path("content").path("parts").path(0).path("text");
            if (text.isMissingNode() || text.asText().isBlank()) {
                log.warn("Gemini missing text parts: {}", raw);
                return "Không nhận được nội dung từ AI. Bạn thử lại sau.";
            }
            return text.asText().trim();
        } catch (Exception e) {
            log.warn("Gemini call failed: {}", e.getMessage());
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            if (errorMsg.contains("403") || errorMsg.toLowerCase().contains("leaked") || errorMsg.toLowerCase().contains("permission_denied")) {
                return "Chào bạn! Trợ lý AI đang tạm ngưng kết nối dịch vụ Gemini (do khóa API cần được làm mới trong file cấu hình .env). Tuy nhiên, bạn vẫn có thể xem các phòng trọ phù hợp được gợi ý bên dưới hoặc dùng bộ lọc ở mục Phòng trọ nhé!";
            }
            return "Trợ lý AI đang bận xử lý. Bạn có thể xem ngay các thẻ phòng phù hợp được hệ thống gợi ý bên dưới hoặc mở trang Danh sách phòng để lọc theo nhu cầu.";
        }
    }

    private static String buildUserBlob(ChatRequest request) {
        StringBuilder sb = new StringBuilder();
        if (request.listingsContext() != null && !request.listingsContext().isBlank()) {
            sb.append("==== Dữ liệu phòng từ hệ thống (đã duyệt; chỉ được phép mô tả phòng dựa trên đây) ====\n");
            sb.append(request.listingsContext().trim()).append("\n\n");
        } else {
            sb.append("==== Dữ liệu phòng từ hệ thống ====\n");
            sb.append("(Không có phòng nào trong gói gợi ý tự động cho truy vấn này.)\n\n");
        }
        if (request.conversationHistory() != null && !request.conversationHistory().isBlank()) {
            sb.append("==== Một phần hội thoại trước (giữ mạch; không cần lặp lại nguyên văn) ====\n");
            sb.append(request.conversationHistory().trim()).append("\n\n");
        }
        sb.append("==== Yêu cầu hiện tại ====\n");
        sb.append(request.message() != null ? request.message().trim() : "");
        return sb.toString();
    }
}
