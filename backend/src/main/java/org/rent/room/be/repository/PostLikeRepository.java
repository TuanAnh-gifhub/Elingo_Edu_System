package org.rent.room.be.repository;

import org.rent.room.be.entity.Post;
import org.rent.room.be.entity.PostLike;
import org.rent.room.be.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {
    Optional<PostLike> findByUserAndPost(User user, Post post);
    boolean existsByUserAndPost(User user, Post post);
    java.util.List<PostLike> findByUserAndPostIn(User user, java.util.List<Post> posts);
}
