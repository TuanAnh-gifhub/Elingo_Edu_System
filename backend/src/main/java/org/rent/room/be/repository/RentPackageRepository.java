package org.rent.room.be.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.rent.room.be.entity.RentPackage;
import java.util.UUID;

@Repository
public interface RentPackageRepository extends JpaRepository<RentPackage, UUID> {
}
