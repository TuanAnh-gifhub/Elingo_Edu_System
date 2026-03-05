package org.rent.room.be.repository;

import org.rent.room.be.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("SELECT p FROM Post p WHERE p.postId = :postId AND p.active = true")
    Optional<Post> findByIdAndActiveTrue(@Param("postId") UUID postId);

    @Query("SELECT p FROM Post p WHERE p.active = true ORDER BY p.createdAt DESC")
    Page<Post> findAllActive(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.author.userId = :userId AND p.active = true ORDER BY p.createdAt DESC")
    Page<Post> findByAuthor_UserIdAndActiveTrue(@Param("userId") UUID userId, Pageable pageable);
}
