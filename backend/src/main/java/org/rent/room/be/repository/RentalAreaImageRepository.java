package org.rent.room.be.repository;

import org.rent.room.be.entity.RentalAreaImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RentalAreaImageRepository  extends JpaRepository<RentalAreaImage, UUID> {

    List<RentalAreaImage> findByRentalAreaRentalAreaIdOrderBySortOrderAsc(UUID rentalAreaId);
}
