package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.post.CreatePostRequest;
import org.rent.room.be.dto.request.post.UpdatePostRequest;
import org.rent.room.be.dto.response.comment.CommentResponse;
import org.rent.room.be.dto.response.post.PostResponse;
import org.rent.room.be.entity.Comment;
import org.rent.room.be.entity.Post;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.CommentMapper;
import org.rent.room.be.mapper.PostMapper;
import org.rent.room.be.repository.CommentRepository;
import org.rent.room.be.repository.PostRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final PostMapper postMapper;
    private final CommentMapper commentMapper;
//... existing code ...
    @Override
    @Transactional
    public PostResponse createPost(CreatePostRequest request, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Post post = Post.builder()
                .author(author)
//... existing code ...
                .images(request.getImages() != null ? request.getImages() : new java.util.ArrayList<>())
                .videos(request.getVideos() != null ? request.getVideos() : new java.util.ArrayList<>())
                .likeCount(0)
                .commentCount(0)
                .active(true)
                .build();

        return postMapper.toResponse(postRepository.save(post));
    }

    @Override
    public PostResponse getPost(UUID postId) {
        Post post = postRepository.findByIdAndActiveTrue(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        // Lấy tất cả comments của post (chỉ comment gốc, không lấy reply)
        List<Comment> comments = commentRepository.findByPostAndParentCommentIsNullAndActiveTrueOrderByCreatedAtAsc(post);
        List<CommentResponse> commentResponses = commentMapper.toResponseList(comments);

        PostResponse response = postMapper.toResponse(post);
        response.setComments(commentResponses);

        return response;
    }

    @Override
    public PageResponse<PostResponse> getPosts(int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Post> pageData = postRepository.findAllActive(pageable);
        // Không load comments trong getPosts để tối ưu performance
        Page<PostResponse> responsePage = pageData.map(postMapper::toResponse);

        return PageResponse.<PostResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    public PageResponse<PostResponse> getPostsByUser(UUID userId, int page, int size) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Post> pageData = postRepository.findByAuthor_UserIdAndActiveTrue(userId, pageable);
        // Không load comments trong getPostsByUser để tối ưu performance
        Page<PostResponse> responsePage = pageData.map(postMapper::toResponse);

        return PageResponse.<PostResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    @Transactional
    public PostResponse updatePost(UUID postId, UpdatePostRequest request) {
        Post post = postRepository.findByIdAndActiveTrue(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }
        if (request.getImages() != null) {
            post.setImages(request.getImages());
        }
        if (request.getVideos() != null) {
            post.setVideos(request.getVideos());
        }

        return postMapper.toResponse(postRepository.save(post));
    }

    @Override
    @Transactional
    public void deletePost(UUID postId) {
        Post post = postRepository.findByIdAndActiveTrue(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        // Soft delete: set active = false
        post.setActive(false);
        postRepository.save(post);
    }
}
