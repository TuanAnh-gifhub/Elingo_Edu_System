package org.rent.room.be.repository;

import org.rent.room.be.constant.TeacherVerificationStatus;
import org.rent.room.be.entity.TeacherVerificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherVerificationRequestRepository extends JpaRepository<TeacherVerificationRequest, UUID> {
    Optional<TeacherVerificationRequest> findTopByUserUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<TeacherVerificationRequest> findTopByUserUserIdAndStatusOrderByCreatedAtDesc(
            UUID userId,
            TeacherVerificationStatus status
    );

    List<TeacherVerificationRequest> findAllByOrderByCreatedAtDesc();
}

