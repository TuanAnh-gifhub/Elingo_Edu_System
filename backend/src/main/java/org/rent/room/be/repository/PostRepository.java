package org.rent.room.be.repository;

import org.rent.room.be.constant.PostStatus;
import org.rent.room.be.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    boolean existsByRoom_RoomId(UUID roomId);

    List<Post> findAllByPostStatus(PostStatus postStatus);

    Optional<Post> findByPostIdAndPostStatus(UUID postId, PostStatus postStatus);

    List<Post> findByUser_UserIdOrderByCreatedAtDesc(UUID userId);

    List<Post> findByUser_UserIdAndPostStatusOrderByCreatedAtDesc(UUID userId, PostStatus status);

    Optional<Post> findByPostIdAndUser_UserId(UUID postId, UUID userId);

    Optional<Post> findByRoom_RoomIdAndUser_UserId(UUID roomId, UUID userId);

    Optional<Post> findByPostIdAndRoom_RentalArea_Owner_UserId(UUID postId, UUID ownerId);


}
