package org.rent.room.be.repository;

import org.rent.room.be.entity.RentalArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RentalAreaRepository extends JpaRepository<RentalArea, UUID> {
    @Query("SELECT r FROM RentalArea r WHERE r.deletedAt IS NULL ORDER BY r.createdAt DESC")
    List<RentalArea> findAllActive();

    @Query("SELECT r FROM RentalArea r WHERE r.owner.userId = :ownerId AND r.deletedAt IS NULL ORDER BY r.createdAt DESC")
    List<RentalArea> findByOwnerId(@Param("ownerId") UUID ownerId);

    @Query("SELECT r FROM RentalArea r WHERE r.rentalAreaId = :id AND r.deletedAt IS NULL")
    Optional<RentalArea> findByIdActive(@Param("id") UUID id);
}