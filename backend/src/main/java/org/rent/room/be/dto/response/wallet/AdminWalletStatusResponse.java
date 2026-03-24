package org.rent.room.be.dto.response.wallet;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.WalletStatus;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminWalletStatusResponse {

    UUID walletId;
    UUID userId;
    String userName;
    BigDecimal balance;
    BigDecimal frozenAmount;
    WalletStatus walletStatus;
    String frozenReason;
}

