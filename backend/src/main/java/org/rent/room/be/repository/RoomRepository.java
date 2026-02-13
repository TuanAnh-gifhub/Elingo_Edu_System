package org.rent.room.be.repository;

import org.rent.room.be.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    @Query("""
        select r
        from Room r
        where r.roomStatus <> org.rent.room.be.constant.RoomStatus.INACTIVE
    """)
    List<Room> findAllNotInactive();

    @Query("""
        select r
        from Room r
        where r.roomStatus <> org.rent.room.be.constant.RoomStatus.INACTIVE
          and r.rentalArea.owner.userId = :userId
    """)
    List<Room> findByOwnerIdNotInactive(@Param("userId") UUID userId);

    @Query("""
    select r
    from Room r
    where r.roomStatus <> org.rent.room.be.constant.RoomStatus.INACTIVE
      and r.rentalArea.rentalAreaId = :rentalAreaId
    """)
    List<Room> findByRentalAreaIdNotInactive(@Param("rentalAreaId") UUID rentalAreaId);


}
