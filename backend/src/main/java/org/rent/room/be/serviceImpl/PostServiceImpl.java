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
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.rent.room.be.repository.PostLikeRepository;
import org.rent.room.be.entity.PostLike;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final PostMapper postMapper;
    private final CommentMapper commentMapper;
    private final PostLikeRepository postLikeRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String email = auth.getName();
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        }
        return userRepository.findByEmail(email).orElse(null);
    }
//... existing code ...
    @Override
    @Transactional
    public PostResponse createPost(CreatePostRequest request, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Post post = Post.builder()
                .author(author)
//... existing code ...
            .content(request.getContent())
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

        User currentUser = getCurrentUser();
        if (currentUser != null) {
            response.setIsLiked(postLikeRepository.existsByUserAndPost(currentUser, post));
        } else {
            response.setIsLiked(false);
        }

        return response;
    }

    @Override
    public PageResponse<PostResponse> getPosts(int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Post> pageData = postRepository.findAllActive(pageable);
        // Không load comments trong getPosts để tối ưu performance
        User currentUser = getCurrentUser();
        List<PostLike> userLikes = currentUser != null ? postLikeRepository.findByUserAndPostIn(currentUser, pageData.getContent()) : java.util.Collections.emptyList();
        
        List<PostResponse> responseList = pageData.getContent().stream().map(post -> {
            PostResponse res = postMapper.toResponse(post);
            res.setIsLiked(userLikes.stream().anyMatch(like -> like.getPost().getPostId().equals(post.getPostId())));
            return res;
        }).collect(Collectors.toList());

        return PageResponse.<PostResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responseList)
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
        User currentUser = getCurrentUser();
        List<PostLike> userLikes = currentUser != null ? postLikeRepository.findByUserAndPostIn(currentUser, pageData.getContent()) : java.util.Collections.emptyList();

        List<PostResponse> responseList = pageData.getContent().stream().map(post -> {
            PostResponse res = postMapper.toResponse(post);
            res.setIsLiked(userLikes.stream().anyMatch(like -> like.getPost().getPostId().equals(post.getPostId())));
            return res;
        }).collect(Collectors.toList());

        return PageResponse.<PostResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responseList)
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

    @Override
    @Transactional
    public void likePost(UUID postId, String email) {
        Post post = postRepository.findByIdAndActiveTrue(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        postLikeRepository.findByUserAndPost(user, post).ifPresentOrElse(
                like -> {
                    postLikeRepository.delete(like);
                    post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
                },
                () -> {
                    PostLike like = PostLike.builder().user(user).post(post).build();
                    postLikeRepository.save(like);
                    post.setLikeCount(post.getLikeCount() + 1);
                }
        );
        postRepository.save(post);
    }
}
