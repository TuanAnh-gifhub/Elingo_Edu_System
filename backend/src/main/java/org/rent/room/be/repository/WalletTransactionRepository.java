package org.rent.room.be.repository;

import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
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

    List<WalletTransaction> findByWalletAndTypeAndMetadataContainingOrderByCreatedAtDesc(
            Wallet wallet,
            WalletTxType type,
            String metadata
    );

    List<WalletTransaction> findByTypeAndStatusAndCreatedAtBetween(
            WalletTxType type,
            WalletTxStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    boolean existsByBookingIdAndType(UUID bookingId, WalletTxType type);

    @Query("""
            select
                count(wt),
                sum(case when wt.status = org.rent.room.be.constant.WalletTxStatus.COMPLETED then 1 else 0 end),
                sum(case when wt.status = org.rent.room.be.constant.WalletTxStatus.FAILED then 1 else 0 end),
                sum(case when wt.status = org.rent.room.be.constant.WalletTxStatus.PENDING then 1 else 0 end),
                sum(case when wt.status = org.rent.room.be.constant.WalletTxStatus.CANCELLED then 1 else 0 end)
            from WalletTransaction wt
            where wt.type = :type
              and wt.createdAt between :from and :to
            """)
    List<Object[]> summarizeByTypeAndCreatedAtBetween(
            @Param("type") WalletTxType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}

