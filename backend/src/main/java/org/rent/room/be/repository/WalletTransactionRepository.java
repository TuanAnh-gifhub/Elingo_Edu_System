package org.rent.room.be.repository;

import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID>,
        JpaSpecificationExecutor<WalletTransaction> {

    Optional<WalletTransaction> findByPayosOrderCode(String payosOrderCode);

    Page<WalletTransaction> findByWalletAndCreatedAtBetween(
            Wallet wallet,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    );

    Page<WalletTransaction> findByWalletAndTypeAndStatusAndCreatedAtBetween(
            Wallet wallet,
            WalletTxType type,
            WalletTxStatus status,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    );

    boolean existsByBookingIdAndType(UUID bookingId, WalletTxType type);
}

