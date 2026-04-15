package org.rent.room.be.repository;

import org.rent.room.be.entity.SubscriptionPackage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionPackageRepository extends JpaRepository<SubscriptionPackage, UUID> {

    List<SubscriptionPackage> findAllByActiveTrue();

    Page<SubscriptionPackage> findAll(Pageable pageable);
}
