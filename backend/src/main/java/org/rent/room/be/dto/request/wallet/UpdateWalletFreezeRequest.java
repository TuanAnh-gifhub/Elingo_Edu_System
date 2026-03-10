package org.rent.room.be.dto.request.wallet;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateWalletFreezeRequest {

    @NotNull(message = "LOCKED_REQUIRED")
    Boolean locked;

    String reason;
}

