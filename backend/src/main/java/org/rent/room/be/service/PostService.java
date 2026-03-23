package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.post.CreatePostRequest;
import org.rent.room.be.dto.request.post.UpdatePostRequest;
import org.rent.room.be.dto.response.post.PostResponse;

import java.util.UUID;

public interface PostService {

    PostResponse createPost(CreatePostRequest request, String email);

    PostResponse getPost(UUID postId);
//... existing code ...
    PageResponse<PostResponse> getPosts(int page, int size);

    PageResponse<PostResponse> getPostsByUser(UUID userId, int page, int size);

    PostResponse updatePost(UUID postId, UpdatePostRequest request);

    void deletePost(UUID postId);

    void likePost(UUID postId, String email);
}
