package org.rent.room.be.repository;

import org.rent.room.be.constant.WithdrawStatus;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WithdrawRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WithdrawRequestRepository extends JpaRepository<WithdrawRequest, UUID> {

    Page<WithdrawRequest> findByWallet(Wallet wallet, Pageable pageable);

    Page<WithdrawRequest> findByWalletAndStatus(Wallet wallet, WithdrawStatus status, Pageable pageable);

    Page<WithdrawRequest> findByStatus(WithdrawStatus status, Pageable pageable);

    Page<WithdrawRequest> findByWallet_User_UserId(UUID userId, Pageable pageable);

    Page<WithdrawRequest> findByWallet_User_UserIdAndStatus(UUID userId, WithdrawStatus status, Pageable pageable);
}

