package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.dto.request.wallet.UpdateWalletFreezeRequest;
import org.rent.room.be.dto.response.wallet.AdminWalletStatusResponse;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.service.WalletAdminService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletAdminServiceImpl implements WalletAdminService {

    private final WalletRepository walletRepository;

    @Override
    @Transactional
    public AdminWalletStatusResponse updateWalletFreezeStatus(UUID userId, UpdateWalletFreezeRequest request) {
        Wallet wallet = walletRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        if (Boolean.TRUE.equals(request.getLocked())) {
            if (request.getReason() == null || request.getReason().isBlank()) {
                throw new RuntimeException("Vui lòng nhập lý do khóa ví");
            }
            wallet.setWalletStatus(WalletStatus.LOCKED);
            wallet.setFrozenReason(request.getReason());
        } else {
            wallet.setWalletStatus(WalletStatus.ACTIVE);
            wallet.setFrozenReason(null);
        }

        walletRepository.save(wallet);

        return AdminWalletStatusResponse.builder()
                .walletId(wallet.getWalletId())
                .userId(wallet.getUser().getUserId())
                .userName(wallet.getUser().getUserName())
                .balance(wallet.getBalance())
                .frozenAmount(wallet.getFrozenAmount())
                .walletStatus(wallet.getWalletStatus())
                .frozenReason(wallet.getFrozenReason())
                .build();
    }
}

