package org.rent.room.be.repository;

import org.rent.room.be.entity.QuestionOption;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, UUID> {
    Page<QuestionOption> findByQuestion_QuestionId(UUID questionId, Pageable pageable);
}

