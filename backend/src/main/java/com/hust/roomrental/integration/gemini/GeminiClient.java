package com.hust.roomrental.integration.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.roomrental.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder().build();

    public String generateReply(String userMessage) {
        String key = appProperties.getGemini().getApiKey();
        if (key == null || key.isBlank()) {
            return "Trợ lý AI chưa được cấu hình (thiếu GEMINI_API_KEY). Tin nhắn của bạn: " + userMessage;
        }
        String model = appProperties.getGemini().getModel();
        String base = appProperties.getGemini().getApiUrl().replaceAll("/$", "");
        String url = base + "/" + model + ":generateContent?key=" + key;
        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text",
                                "Bạn là trợ lý tìm phòng trọ cho sinh viên/khu vực HUST. Trả lời ngắn gọn, thân thiện.\n\nUser: "
                                        + userMessage)))
                )
        );
        try {
            String raw = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = objectMapper.readTree(raw);
            JsonNode text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (text.isMissingNode() || text.asText().isBlank()) {
                return "Không nhận được nội dung từ Gemini. Phản hồi thô: " + raw;
            }
            return text.asText();
        } catch (Exception e) {
            log.warn("Gemini call failed", e);
            return "Lỗi khi gọi Gemini: " + e.getMessage();
        }
    }
}
