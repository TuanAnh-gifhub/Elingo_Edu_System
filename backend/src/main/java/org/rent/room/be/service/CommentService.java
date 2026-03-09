package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.comment.CreateCommentRequest;
import org.rent.room.be.dto.request.comment.UpdateCommentRequest;
import org.rent.room.be.dto.response.comment.CommentResponse;

import java.util.List;
import java.util.UUID;

public interface CommentService {

    CommentResponse createComment(CreateCommentRequest request, UUID userId);

    List<CommentResponse> getCommentsByPost(UUID postId);

    CommentResponse updateComment(UUID commentId, UpdateCommentRequest request, UUID userId);

    void deleteComment(UUID commentId, UUID userId);
}

