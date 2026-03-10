package org.rent.room.be.dto.response.wallet;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.WithdrawStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminWithdrawRequestItemResponse {

    UUID withdrawRequestId;
    UUID walletId;
    UUID userId;
    String userName;
    BigDecimal amount;
    String bankCode;
    String bankAccountNumber;
    String bankAccountName;
    WithdrawStatus status;
    String adminNote;
    UUID processedBy;
    LocalDateTime processedAt;
    LocalDateTime createdAt;
}

