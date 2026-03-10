package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.comment.CreateCommentRequest;
import org.rent.room.be.dto.request.comment.UpdateCommentRequest;
import org.rent.room.be.dto.response.comment.CommentResponse;
import org.rent.room.be.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/comments")
@Tag(name = "6. Comment")
public class CommentController {

    CommentService commentService;

    private String getEmailFromAuthentication(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalStateException("Authentication object is null. User might not be authenticated.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            return (String) principal;
        }
        throw new IllegalStateException("Unsupported principal type: " + principal.getClass().getName());
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        String email = getEmailFromAuthentication(authentication);
        CommentResponse response = commentService.createComment(request, email);
        return ResponseEntity.ok(
                ApiResponse.<CommentResponse>builder()
                        .code(201)
                        .message("Create comment successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getAllComments() {
        List<CommentResponse> responses = commentService.getAllComments();
        return ResponseEntity.ok(
                ApiResponse.<List<CommentResponse>>builder()
                        .code(200)
                        .message("Get all comments successfully")
                        .result(responses)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT') or hasRole('ADMIN')")
    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Authentication authentication
    ) {
        String email = getEmailFromAuthentication(authentication);
        CommentResponse response = commentService.updateComment(commentId, request, email);
        return ResponseEntity.ok(
                ApiResponse.<CommentResponse>builder()
                        .code(200)
                        .message("Update comment successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT') or hasRole('ADMIN')")
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable UUID commentId,
            Authentication authentication
    ) {
        String email = getEmailFromAuthentication(authentication);
        commentService.deleteComment(commentId, email);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Delete comment successfully")
                        .build()
        );
    }
}

