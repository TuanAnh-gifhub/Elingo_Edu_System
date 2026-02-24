package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.post.CreatePostRequest;
import org.rent.room.be.dto.request.post.UpdatePostRequest;
import org.rent.room.be.dto.response.post.PostDetailResponse;
import org.rent.room.be.dto.response.post.PostResponse;
import org.rent.room.be.dto.response.post.PostSummaryResponse;
import org.rent.room.be.security.CustomUserDetails;
import org.rent.room.be.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "8. Post")
public class PostController {

    PostService postService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = extractUserId(principal);

        PostResponse result = postService.createPost(request, currentUserId);

        ApiResponse<PostResponse> response = ApiResponse.<PostResponse>builder()
                .code(200)
                .message("Create post successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    // Public feed
    @GetMapping
    public ResponseEntity<ApiResponse<List<PostSummaryResponse>>> getAllPosts() {
        List<PostSummaryResponse> result = postService.getAllPosts();

        ApiResponse<List<PostSummaryResponse>> response = ApiResponse.<List<PostSummaryResponse>>builder()
                .code(200)
                .message("Get all posts successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    // Public detail
    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> getPostDetail(
            @PathVariable UUID postId
    ) {
        PostDetailResponse result = postService.getPostDetail(postId);

        ApiResponse<PostDetailResponse> response = ApiResponse.<PostDetailResponse>builder()
                .code(200)
                .message("Get post detail successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    // =========================
    // Owner manage
    // =========================

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<PostSummaryResponse>>> getMyPosts(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = extractUserId(principal);

        List<PostSummaryResponse> result = postService.getMyPosts(currentUserId, status);

        ApiResponse<List<PostSummaryResponse>> response = ApiResponse.<List<PostSummaryResponse>>builder()
                .code(200)
                .message("Get my posts successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/{postId}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> getMyPostDetail(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = extractUserId(principal);

        PostDetailResponse result = postService.getMyPostDetail(postId, currentUserId);

        ApiResponse<PostDetailResponse> response = ApiResponse.<PostDetailResponse>builder()
                .code(200)
                .message("Get my post detail successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> updateMyPost(
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = extractUserId(principal);

        PostResponse result = postService.updateMyPost(postId, request, currentUserId);

        ApiResponse<PostResponse> response = ApiResponse.<PostResponse>builder()
                .code(200)
                .message("Update post successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{postId}/status")
    public ResponseEntity<ApiResponse<PostResponse>> updatePostStatus(
            @PathVariable UUID postId,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = null;
        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }
        if (currentUserId == null) {
            throw new RuntimeException("User not authenticated");
        }

        PostResponse result = postService.updateMyPostStatus(postId, status, currentUserId);

        ApiResponse<PostResponse> response = ApiResponse.<PostResponse>builder()
                .code(200)
                .message("Update post status successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deleteMyPost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = extractUserId(principal);

        postService.deleteMyPost(postId, currentUserId);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(200)
                .message("Delete post successfully")
                .result(null)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/by-room/{roomId}")
    public ResponseEntity<ApiResponse<PostResponse>> getMyPostByRoom(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = extractUserId(principal);

        PostResponse result = postService.getMyPostByRoom(roomId, currentUserId);

        ApiResponse<PostResponse> response = ApiResponse.<PostResponse>builder()
                .code(200)
                .message("Get my post by room successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    private UUID extractUserId(UserDetails principal) {
        UUID currentUserId = null;

        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }

        if (currentUserId == null) {
            throw new RuntimeException("User not authenticated");
        }

        return currentUserId;
    }
}
