package org.rent.room.be.repository;

import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findByActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    Page<Review> findByClassRoomAndActiveTrueOrderByCreatedAtDesc(ClassRoom classRoom, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.classRoom IS NULL AND r.active = true ORDER BY r.createdAt DESC")
    Page<Review> findGlobalReviews(Pageable pageable);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.classRoom = :classRoom AND r.active = true")
    long countByClassRoomAndActiveTrue(@Param("classRoom") ClassRoom classRoom);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.classRoom = :classRoom AND r.active = true")
    Double averageRatingForClass(@Param("classRoom") ClassRoom classRoom);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.classRoom IS NULL AND r.active = true")
    long countGlobalReviews();

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.classRoom IS NULL AND r.active = true")
    Double averageRatingGlobal();

    void deleteByClassRoom_ClassId(UUID classId);

}
