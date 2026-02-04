package org.rent.room.be.repository;

import org.rent.room.be.entity.RoomImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RoomImageRepository extends JpaRepository<RoomImage, UUID> {
}
