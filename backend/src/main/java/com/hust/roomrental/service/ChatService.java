package com.hust.roomrental.service;

import com.hust.roomrental.dto.chat.ChatRequest;
import com.hust.roomrental.dto.chat.ChatResponse;

public interface ChatService {

    ChatResponse chat(ChatRequest request);
}
