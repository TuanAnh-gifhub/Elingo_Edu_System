package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.dto.response.wallet.WalletInfoResponse;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.service.UserService;
import org.rent.room.be.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final UserService userService;

    @Override
    @Transactional
    public Wallet getOrCreateWallet(User user) {
        return walletRepository.findByUser(user)
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .user(user)
                        .balance(BigDecimal.ZERO)
                        .frozenAmount(BigDecimal.ZERO)
                        .walletStatus(WalletStatus.ACTIVE)
                        .build()));
    }

    @Override
    @Transactional(readOnly = true)
    public Wallet getOrCreateCurrentUserWallet() {
        User currentUser = userService.getCurrentUserEntity();
        return getOrCreateWallet(currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletInfoResponse getMyWalletInfo() {
        Wallet wallet = getOrCreateCurrentUserWallet();
        boolean isFrozen = wallet.getWalletStatus() == WalletStatus.LOCKED;
        return WalletInfoResponse.builder()
                .walletId(wallet.getWalletId())
                .balance(wallet.getBalance())
                .frozenAmount(wallet.getFrozenAmount())
                .isFrozen(isFrozen)
                .frozenReason(wallet.getFrozenReason())
                .createdAt(wallet.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getCurrentBalance() {
        return getOrCreateCurrentUserWallet().getBalance();
    }

    @Override
    @Transactional
    public void debit(Wallet wallet, BigDecimal amount) {
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient funds");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);
    }
}
