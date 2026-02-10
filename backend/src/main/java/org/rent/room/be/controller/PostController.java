package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.post.CreatePostRequest;
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
        UUID currentUserId = null;

        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }

        if (currentUserId == null) {
            throw new RuntimeException("User not authenticated");
        }

        PostResponse result = postService.createPost(request, currentUserId);

        ApiResponse<PostResponse> response = ApiResponse.<PostResponse>builder()
                .code(200)
                .message("Create post successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

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

}
