package org.rent.room.be.controller;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.chat.CreateClassGroupConversationRequest;
import org.rent.room.be.dto.request.chat.CreatePrivateConversationRequest;
import org.rent.room.be.dto.request.chat.MessageRequest;
import org.rent.room.be.dto.response.chat.ConversationResponse;
import org.rent.room.be.dto.response.chat.MessageResponse;
import org.rent.room.be.security.CustomUserDetails;
import org.rent.room.be.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ConversationController {

    private final ChatService chatService;

    @PostMapping("/conversations/private")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ConversationResponse>> createOrGetPrivateConversation(
            @RequestBody CreatePrivateConversationRequest request,
            Authentication authentication
    ) {
        UUID currentUserId = extractCurrentUserId(authentication);
        ConversationResponse result = chatService.createOrGetPrivateConversation(request.getUserId(), currentUserId);
        return ResponseEntity.ok(ApiResponse.<ConversationResponse>builder().result(result).build());
    }

    @PostMapping("/conversations/group/class")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ConversationResponse>> createOrGetClassGroupConversation(
            @RequestBody CreateClassGroupConversationRequest request,
            Authentication authentication
    ) {
        UUID currentUserId = extractCurrentUserId(authentication);
        ConversationResponse result = chatService.createOrGetClassGroupConversation(request.getClassId(), currentUserId);
        return ResponseEntity.ok(ApiResponse.<ConversationResponse>builder().result(result).build());
    }

    @GetMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getConversationMessages(
            @PathVariable UUID conversationId,
            Authentication authentication
    ) {
        UUID currentUserId = extractCurrentUserId(authentication);
        List<MessageResponse> result = chatService.getMessagesByConversation(conversationId, currentUserId);
        return ResponseEntity.ok(ApiResponse.<List<MessageResponse>>builder().result(result).build());
    }

    @PostMapping("/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @RequestBody MessageRequest request,
            Authentication authentication
    ) {
        UUID currentUserId = extractCurrentUserId(authentication);
        MessageResponse result = chatService.sendMessage(request, currentUserId);
        return ResponseEntity.ok(ApiResponse.<MessageResponse>builder().result(result).build());
    }

    private UUID extractCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUserId();
        }

        throw new RuntimeException("Invalid authentication principal");
    }
}

