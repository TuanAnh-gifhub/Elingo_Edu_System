package org.rent.room.be.dto.request.wallet;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateClassWalletFeeRequest {

    @NotNull(message = "FEE_PERCENT_REQUIRED")
    @DecimalMin(value = "0.0", message = "FEE_PERCENT_INVALID")
    @DecimalMax(value = "100.0", message = "FEE_PERCENT_INVALID")
    BigDecimal feePercent;

    String note;
}

