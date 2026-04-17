package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.chat.MessageRequest;
import org.rent.room.be.dto.response.chat.ConversationResponse;
import org.rent.room.be.dto.response.chat.MessageResponse;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.security.SecurityUtils;
import org.rent.room.be.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
@Tag(name = "8. Chat")
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/chat")
    public void processMessage(@Payload MessageRequest messageRequest, Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated in WebSocket");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.rent.room.be.security.CustomUserDetails customUserDetails) {
            chatService.saveMessage(messageRequest, customUserDetails.getUserId());
        } else {
            throw new RuntimeException("Invalid authentication principal");
        }
    }

    @GetMapping("/conversations/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(@PathVariable UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        if (!currentUserId.equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        List<ConversationResponse> result = chatService.getUserConversations(userId);
        return ResponseEntity.ok(ApiResponse.<List<ConversationResponse>>builder()
                .result(result)
                .build());
    }

    @GetMapping("/history/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getHistory(@PathVariable UUID conversationId) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        List<MessageResponse> result = chatService.getMessagesByConversation(conversationId, currentUserId);
        return ResponseEntity.ok(ApiResponse.<List<MessageResponse>>builder()
                .result(result)
                .build());
    }

    @GetMapping("/conversation/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(@PathVariable UUID conversationId) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        ConversationResponse result = chatService.getConversationById(conversationId, currentUserId);
        return ResponseEntity.ok(ApiResponse.<ConversationResponse>builder()
                .result(result)
                .build());
    }

    @PostMapping("/conversations/direct/{recipientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ConversationResponse>> openDirectConversation(@PathVariable UUID recipientId) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        ConversationResponse result = chatService.getOrCreateDirectConversation(currentUserId, recipientId);
        return ResponseEntity.ok(ApiResponse.<ConversationResponse>builder()
                .result(result)
                .build());
    }

    @PatchMapping("/conversations/{conversationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markConversationAsRead(
            @PathVariable UUID conversationId,
            @RequestParam UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        if (!currentUserId.equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        chatService.markAllMessagesInConversationAsRead(conversationId, currentUserId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Conversation marked as read")
                .build());
    }

    @PostMapping(value = "/send-with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessageWithImage(
            @RequestPart("data") MessageRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Authentication authentication) throws IOException {

        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.rent.room.be.security.CustomUserDetails customUserDetails) {
            MessageResponse response = chatService.saveMessageWithFile(request, customUserDetails.getUserId(), file);
            return ResponseEntity.ok(ApiResponse.<MessageResponse>builder().result(response).build());
        }
        throw new RuntimeException("Invalid authentication principal");
    }

    @DeleteMapping("/conversations/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(@PathVariable UUID conversationId) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        chatService.deleteConversationForCurrentUser(conversationId, currentUserId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .message("Conversation deleted")
                        .build()
        );
    }
}

