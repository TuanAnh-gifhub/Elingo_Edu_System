package org.rent.room.be.repository;

import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface WalletRepository extends JpaRepository<Wallet, UUID>, JpaSpecificationExecutor<Wallet> {

    Optional<Wallet> findByUser(User user);

    Optional<Wallet> findByUser_UserId(UUID userId);
}

