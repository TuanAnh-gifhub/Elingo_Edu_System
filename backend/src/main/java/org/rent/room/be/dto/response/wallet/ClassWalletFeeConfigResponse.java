package org.rent.room.be.dto.response.wallet;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassWalletFeeConfigResponse {

    BigDecimal feePercent;
    String note;
    LocalDateTime effectiveFrom;
    LocalDateTime updatedAt;
}

