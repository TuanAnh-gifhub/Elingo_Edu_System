package org.rent.room.be.dto.request.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateWithdrawRequest {

    @NotNull(message = "AMOUNT_REQUIRED")
    @DecimalMin(value = "10000", message = "AMOUNT_MIN_10000")
    BigDecimal amount;

    @NotBlank(message = "BANK_CODE_REQUIRED")
    String bankCode;

    @NotBlank(message = "BANK_ACCOUNT_NUMBER_REQUIRED")
    String bankAccountNumber;

    @NotBlank(message = "BANK_ACCOUNT_NAME_REQUIRED")
    String bankAccountName;
}

