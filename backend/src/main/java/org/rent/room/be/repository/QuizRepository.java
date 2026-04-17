package org.rent.room.be.repository;

import org.rent.room.be.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    Page<Quiz> findByCourse_CourseId(UUID courseId, Pageable pageable);

    List<Quiz> findByCourse_CourseIdIn(Collection<UUID> courseIds);
}
