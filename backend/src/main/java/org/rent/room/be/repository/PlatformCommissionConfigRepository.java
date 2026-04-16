package org.rent.room.be.repository;

import org.rent.room.be.entity.PlatformCommissionConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlatformCommissionConfigRepository extends JpaRepository<PlatformCommissionConfig, UUID> {

    Optional<PlatformCommissionConfig> findFirstByActiveTrueAndEffectiveToIsNullOrderByEffectiveFromDesc();
}

