package org.rent.room.be.service;

import org.rent.room.be.dto.response.ai.ClassAiChatResponse;
import org.rent.room.be.dto.response.ai.ClassAiHistoryMessageResponse;

import java.util.List;
import java.util.UUID;

public interface ClassAiService {

	ClassAiChatResponse chatWithClassAssistant(UUID classId, UUID studentId, String message);

	List<ClassAiHistoryMessageResponse> getChatHistory(UUID classId, UUID studentId);
}


