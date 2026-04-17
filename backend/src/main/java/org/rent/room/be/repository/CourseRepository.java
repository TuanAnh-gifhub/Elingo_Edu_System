package org.rent.room.be.repository;

import org.rent.room.be.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    Page<Course> findByClassRoom_ClassId(UUID classId, Pageable pageable);

    List<Course> findByClassRoom_ClassIdOrderByOrderIndexAsc(UUID classId);
}

