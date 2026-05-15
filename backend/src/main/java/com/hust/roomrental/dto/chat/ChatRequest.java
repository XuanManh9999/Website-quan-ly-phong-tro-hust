package com.hust.roomrental.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @param message            Latest user intent (plain text or expanded from quick-pick).
 * @param sessionId          Optional client session id for future use.
 * @param listingsContext    Grounding text: curated listings from DB search (may be empty).
 * @param conversationHistory Short digest of prior turns for multi-turn coherence.
 */
public record ChatRequest(
        @NotBlank @Size(max = 4000) String message,
        String sessionId,
        @Size(max = 8000) String listingsContext,
        @Size(max = 6000) String conversationHistory
) {
}
