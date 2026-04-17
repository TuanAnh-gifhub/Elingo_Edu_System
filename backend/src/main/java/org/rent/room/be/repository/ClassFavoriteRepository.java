package org.rent.room.be.repository;

import org.rent.room.be.entity.ClassFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassFavoriteRepository extends JpaRepository<ClassFavorite, UUID> {

    List<ClassFavorite> findByUser_UserIdOrderByCreatedAtDesc(UUID userId);

    Optional<ClassFavorite> findByUser_UserIdAndClassRoom_ClassId(UUID userId, UUID classId);

    boolean existsByUser_UserIdAndClassRoom_ClassId(UUID userId, UUID classId);

    void deleteByUser_UserIdAndClassRoom_ClassId(UUID userId, UUID classId);

    void deleteByClassRoom_ClassId(UUID classId);
}
