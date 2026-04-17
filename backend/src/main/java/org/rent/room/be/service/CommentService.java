package org.rent.room.be.service;

import org.rent.room.be.dto.request.comment.CreateCommentRequest;
import org.rent.room.be.dto.request.comment.UpdateCommentRequest;
import org.rent.room.be.dto.response.comment.CommentResponse;

import java.util.List;
import java.util.UUID;

public interface CommentService {

    CommentResponse createComment(CreateCommentRequest request, String email);


    List<CommentResponse> getAllCommentsByPostId(UUID postId);

    List<CommentResponse> getHiddenCommentsByPostId(UUID postId);

    CommentResponse updateComment(UUID commentId, UpdateCommentRequest request, String email);

    void deleteComment(UUID commentId, String email);

    void restoreComment(UUID commentId, String email);
}