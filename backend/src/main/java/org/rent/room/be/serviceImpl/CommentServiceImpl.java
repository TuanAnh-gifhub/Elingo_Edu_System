package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.dto.request.comment.CreateCommentRequest;
import org.rent.room.be.dto.request.comment.UpdateCommentRequest;
import org.rent.room.be.dto.response.comment.CommentResponse;
import org.rent.room.be.entity.Comment;
import org.rent.room.be.entity.Post;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.CommentMapper;
import org.rent.room.be.repository.CommentRepository;
import org.rent.room.be.repository.PostRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.CommentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;

    @Override
    @Transactional
    public CommentResponse createComment(CreateCommentRequest request, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Post post = null;
        if (request.getPostId() != null) {
            post = postRepository.findByIdAndActiveTrue(request.getPostId()).orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
        }

        Comment.CommentBuilder commentBuilder = Comment.builder()
                .author(user)
                .content(request.getContent())
                .images(request.getImages() != null ? request.getImages().stream().filter(s -> !s.equals("string")).collect(java.util.stream.Collectors.toList()) : new java.util.ArrayList<>())
                .videos(request.getVideos() != null ? request.getVideos().stream().filter(s -> !s.equals("string")).collect(java.util.stream.Collectors.toList()) : new java.util.ArrayList<>())
                .active(true)
                .likeCount(0);

        if (post != null) {
            commentBuilder.post(post);
        }

        Comment comment = commentBuilder.build();

        Comment saved = commentRepository.save(comment);

        if (post != null) {
            // update post comment count
            post.setCommentCount(post.getCommentCount() + 1);
            postRepository.save(post);
        }

        return commentMapper.toResponse(saved);
    }


    @Override
    public List<CommentResponse> getAllCommentsByPostId(UUID postId) {
        List<Comment> comments = commentRepository.findAllByPostPostIdAndParentCommentIsNullAndActiveTrueOrderByCreatedAtAsc(postId);
        return commentMapper.toResponseList(comments);
    }

    @Override
    public List<CommentResponse> getHiddenCommentsByPostId(UUID postId) {
        List<Comment> comments = commentRepository
                .findAllByPostPostIdAndParentCommentIsNullAndActiveFalseOrderByCreatedAtDesc(postId);
        return commentMapper.toResponseList(comments);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(UUID commentId, UpdateCommentRequest request, String email) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.isActive()) {
            throw new AppException(ErrorCode.COMMENT_NOT_FOUND);
        }

        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (!comment.getAuthor().getUserId().equals(user.getUserId())) {
            // allow admin - check role
            boolean isAdmin = user.getRole() != null && "ROLE_ADMIN".equals(user.getRole().getRoleName());
            if (!isAdmin) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        comment.setContent(request.getContent());
        if (request.getImages() != null) comment.setImages(request.getImages());
        if (request.getVideos() != null) comment.setVideos(request.getVideos());

        return commentMapper.toResponse(commentRepository.save(comment));
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId, String email) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.isActive()) {
            throw new AppException(ErrorCode.COMMENT_NOT_FOUND);
        }

        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean isAdmin = user.getRole() != null && (
                "ROLE_ADMIN".equals(user.getRole().getRoleName())
                        || "ADMIN".equals(user.getRole().getRoleName())
        );
        if (!isAdmin) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // soft delete
        comment.setActive(false);
        commentRepository.save(comment);

        // decrement post comment count safely
        Post post = comment.getPost();
        post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
        postRepository.save(post);
    }

    @Override
    @Transactional
    public void restoreComment(UUID commentId, String email) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if (comment.isActive()) {
            return;
        }

        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean isAdmin = user.getRole() != null && (
                "ROLE_ADMIN".equals(user.getRole().getRoleName())
                        || "ADMIN".equals(user.getRole().getRoleName())
        );
        if (!isAdmin) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        comment.setActive(true);
        commentRepository.save(comment);

        Post post = comment.getPost();
        post.setCommentCount((post.getCommentCount() == null ? 0 : post.getCommentCount()) + 1);
        postRepository.save(post);
    }
}