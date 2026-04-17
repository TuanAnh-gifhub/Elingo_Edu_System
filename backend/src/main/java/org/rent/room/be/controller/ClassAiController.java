package org.rent.room.be.controller;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.ai.ClassAiChatRequest;
import org.rent.room.be.dto.response.ai.ClassAiChatResponse;
import org.rent.room.be.dto.response.ai.ClassAiHistoryMessageResponse;
import org.rent.room.be.security.SecurityUtils;
import org.rent.room.be.serviceImpl.ClassAiServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.UUID;
@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/classes")
@Tag(name = "17. Class AI")
public class ClassAiController {
    ClassAiServiceImpl classAiService;

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/{classId}/ai/history")
    public ResponseEntity<ApiResponse<List<ClassAiHistoryMessageResponse>>> history(@PathVariable UUID classId) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        List<ClassAiHistoryMessageResponse> response = classAiService.getChatHistory(classId, currentUserId);
        return ResponseEntity.ok(
                ApiResponse.<List<ClassAiHistoryMessageResponse>>builder()
                        .code(200)
                        .message("Get class AI history successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{classId}/ai/chat")
    public ResponseEntity<ApiResponse<ClassAiChatResponse>> chat(
            @PathVariable UUID classId,
            @Valid @RequestBody ClassAiChatRequest request
    ) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        ClassAiChatResponse response = classAiService.chatWithClassAssistant(classId, currentUserId, request.getMessage());
        return ResponseEntity.ok(
                ApiResponse.<ClassAiChatResponse>builder()
                        .code(200)
                        .message("Chat with class AI successfully")
                        .result(response)
                        .build()
        );
    }
}
