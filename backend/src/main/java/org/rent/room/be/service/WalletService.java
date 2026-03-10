package org.rent.room.be.service;

import org.rent.room.be.dto.response.wallet.WalletInfoResponse;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;

import java.math.BigDecimal;

public interface WalletService {

    Wallet getOrCreateWallet(User user);

    Wallet getOrCreateCurrentUserWallet();

    WalletInfoResponse getMyWalletInfo();

    BigDecimal getCurrentBalance();
}

