package org.rent.room.be.repository;

import org.rent.room.be.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    boolean existsByStudent_UserIdAndEnrolledClass_ClassId(UUID studentId, UUID classId);
}

