package org.rent.room.be.dto.request.wallet;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminWithdrawRejectRequest {

    @NotBlank(message = "ADMIN_NOTE_REQUIRED")
    String adminNote;
}

