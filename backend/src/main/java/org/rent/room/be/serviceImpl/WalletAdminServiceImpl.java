package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.dto.request.wallet.UpdateClassWalletFeeRequest;
import org.rent.room.be.dto.request.wallet.UpdateWalletFreezeRequest;
import org.rent.room.be.dto.response.wallet.AdminWalletStatusResponse;
import org.rent.room.be.dto.response.wallet.ClassWalletFeeConfigResponse;
import org.rent.room.be.entity.PlatformCommissionConfig;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.PlatformCommissionConfigRepository;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.service.WalletAdminService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletAdminServiceImpl implements WalletAdminService {

    private final WalletRepository walletRepository;
    private final PlatformCommissionConfigRepository platformCommissionConfigRepository;

    private static final BigDecimal DEFAULT_CLASS_WALLET_FEE_PERCENT = BigDecimal.ZERO;

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

    @Override
    @Transactional(readOnly = true)
    public ClassWalletFeeConfigResponse getClassWalletFeeConfig() {
        PlatformCommissionConfig config = platformCommissionConfigRepository
                .findFirstByActiveTrueAndEffectiveToIsNullOrderByEffectiveFromDesc()
                .orElse(null);

        if (config == null) {
            return ClassWalletFeeConfigResponse.builder()
                    .feePercent(DEFAULT_CLASS_WALLET_FEE_PERCENT)
                    .note(null)
                    .effectiveFrom(null)
                    .updatedAt(null)
                    .build();
        }

        return ClassWalletFeeConfigResponse.builder()
                .feePercent(sanitizeFeePercent(config.getCommissionRate()))
                .note(config.getDescription())
                .effectiveFrom(config.getEffectiveFrom())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public ClassWalletFeeConfigResponse updateClassWalletFeeConfig(UpdateClassWalletFeeRequest request, UUID adminId) {
        BigDecimal nextFeePercent = sanitizeFeePercent(request.getFeePercent());

        PlatformCommissionConfig config = platformCommissionConfigRepository
                .findFirstByActiveTrueAndEffectiveToIsNullOrderByEffectiveFromDesc()
                .orElseGet(() -> PlatformCommissionConfig.builder()
                        .commissionType(PlatformCommissionConfig.CommissionType.PERCENTAGE)
                        .effectiveFrom(LocalDateTime.now())
                        .active(true)
                        .build());

        config.setCommissionType(PlatformCommissionConfig.CommissionType.PERCENTAGE);
        config.setCommissionRate(nextFeePercent);
        config.setDescription(request.getNote());
        config.setActive(true);
        config.setEffectiveTo(null);
        if (config.getEffectiveFrom() == null) {
            config.setEffectiveFrom(LocalDateTime.now());
        }

        PlatformCommissionConfig saved = platformCommissionConfigRepository.save(config);

        return ClassWalletFeeConfigResponse.builder()
                .feePercent(saved.getCommissionRate())
                .note(saved.getDescription())
                .effectiveFrom(saved.getEffectiveFrom())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    private BigDecimal sanitizeFeePercent(BigDecimal feePercent) {
        if (feePercent == null) {
            return DEFAULT_CLASS_WALLET_FEE_PERCENT;
        }
        if (feePercent.compareTo(BigDecimal.ZERO) < 0 || feePercent.compareTo(new BigDecimal("100")) > 0) {
            throw new RuntimeException("Phí nền tảng phải nằm trong khoảng từ 0 đến 100");
        }
        return feePercent;
    }
}

