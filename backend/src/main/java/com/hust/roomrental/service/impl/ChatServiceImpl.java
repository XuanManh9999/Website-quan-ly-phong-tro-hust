package com.hust.roomrental.service.impl;

import com.hust.roomrental.dto.chat.ChatRequest;
import com.hust.roomrental.dto.chat.ChatResponse;
import com.hust.roomrental.integration.gemini.GeminiClient;
import com.hust.roomrental.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final GeminiClient geminiClient;

    @Override
    public ChatResponse chat(ChatRequest request) {
        String sessionId = request.sessionId() != null && !request.sessionId().isBlank()
                ? request.sessionId()
                : UUID.randomUUID().toString();
        String reply = geminiClient.generateReply(request);
        return new ChatResponse(reply, sessionId);
    }
}
