package org.rent.room.be.dto.request.wallet;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateDepositLinkRequest {

    @NotNull(message = "AMOUNT_REQUIRED")
    @Min(value = 10000, message = "AMOUNT_MIN_10000")
    Long amount;
}

