package org.rent.room.be.repository;

import org.rent.room.be.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    @Query("SELECT e FROM Enrollment e WHERE e.student.userId = :studentId AND e.enrolledClass.classId = :classId")
    Optional<Enrollment> findByStudentIdAndClassId(@Param("studentId") UUID studentId, @Param("classId") UUID classId);

    boolean existsByStudent_UserIdAndEnrolledClass_ClassId(UUID studentId, UUID classId);

    List<Enrollment> findByStudent_UserId(UUID studentId);

    List<Enrollment> findByEnrolledClass_ClassId(UUID classId);
    @Query("SELECT e FROM Enrollment e WHERE e.enrolledClass.classId = :classId ORDER BY e.enrollmentDate ASC, e.createdAt ASC")
    List<Enrollment> findByClassIdOrderByEnrollmentDateAsc(@Param("classId") UUID classId);
}
