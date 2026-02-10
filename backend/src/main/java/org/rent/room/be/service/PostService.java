package org.rent.room.be.service;

import org.rent.room.be.dto.request.post.CreatePostRequest;
import org.rent.room.be.dto.response.post.PostDetailResponse;
import org.rent.room.be.dto.response.post.PostResponse;
import org.rent.room.be.dto.response.post.PostSummaryResponse;

import java.util.List;
import java.util.UUID;

public interface PostService {

    PostResponse createPost(CreatePostRequest request, UUID currentUserId);

    List<PostSummaryResponse> getAllPosts();

    PostDetailResponse getPostDetail(UUID postId);
}
