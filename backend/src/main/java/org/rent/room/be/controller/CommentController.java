package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
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
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/comments")
@Tag(name = "6. Comment")
public class CommentController {

    CommentService commentService;

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CreateCommentRequest request,
            Principal principal
    ) {
        // assuming principal name contains userId (UUID string)
        UUID userId = UUID.fromString(principal.getName());
        CommentResponse response = commentService.createComment(request, userId);
        return ResponseEntity.ok(
                ApiResponse.<CommentResponse>builder()
                        .code(201)
                        .message("Create comment successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getCommentsByPost(
            @RequestParam UUID postId
    ) {
        List<CommentResponse> responses = commentService.getCommentsByPost(postId);
        return ResponseEntity.ok(
                ApiResponse.<List<CommentResponse>>builder()
                        .code(200)
                        .message("Get comments successfully")
                        .result(responses)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT')")
    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Principal principal
    ) {
        UUID userId = UUID.fromString(principal.getName());
        CommentResponse response = commentService.updateComment(commentId, request, userId);
        return ResponseEntity.ok(
                ApiResponse.<CommentResponse>builder()
                        .code(200)
                        .message("Update comment successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT')")
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable UUID commentId,
            Principal principal
    ) {
        UUID userId = UUID.fromString(principal.getName());
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Delete comment successfully")
                        .build()
        );
    }
}

