package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.post.CreatePostRequest;
import org.rent.room.be.dto.request.post.UpdatePostRequest;
import org.rent.room.be.dto.response.post.PostResponse;
import org.rent.room.be.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/posts")
@Tag(name = "5. Post")
public class PostController {

    PostService postService;

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @RequestBody CreatePostRequest request
    ) {
        PostResponse response = postService.createPost(request);
        return ResponseEntity.ok(
                ApiResponse.<PostResponse>builder()
                        .code(201)
                        .message("Create post successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @PathVariable UUID postId
    ) {
        PostResponse response = postService.getPost(postId);
        return ResponseEntity.ok(
                ApiResponse.<PostResponse>builder()
                        .code(200)
                        .message("Get post successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getPosts(
            @RequestParam(required = false) UUID userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<PostResponse> result;
        if (userId != null) {
            result = postService.getPostsByUser(userId, page - 1, size);
        } else {
            result = postService.getPosts(page - 1, size);
        }
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<PostResponse>>builder()
                        .code(200)
                        .message("Get posts successfully")
                        .result(result)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT')")
    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable UUID postId,
            @RequestBody UpdatePostRequest request
    ) {
        PostResponse response = postService.updatePost(postId, request);
        return ResponseEntity.ok(
                ApiResponse.<PostResponse>builder()
                        .code(200)
                        .message("Update post successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('STUDENT')")
    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable UUID postId
    ) {
        postService.deletePost(postId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Delete post successfully")
                        .build()
        );
    }
}