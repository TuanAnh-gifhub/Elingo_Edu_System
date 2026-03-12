package org.rent.room.be.repository;

import org.rent.room.be.entity.Comment;
import org.rent.room.be.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    List<Comment> findByPostAndParentCommentIsNullAndActiveTrueOrderByCreatedAtAsc(Post post);


    List<Comment> findAllByParentCommentIsNullAndActiveTrueOrderByCreatedAtAsc();

    List<Comment> findAllByPostPostIdAndParentCommentIsNullAndActiveTrueOrderByCreatedAtAsc(UUID postId);

    List<Comment> findByPostAndActiveTrueOrderByCreatedAtAsc(Post post);
}
