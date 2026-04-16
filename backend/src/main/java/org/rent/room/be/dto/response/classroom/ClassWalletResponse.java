package org.rent.room.be.dto.response.classroom;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassWalletResponse {

    UUID classId;
    BigDecimal balance;
    BigDecimal feePercent;
    BigDecimal feeAmount;
    BigDecimal receivableAmount;
    boolean claimable;
    LocalDateTime endDate;
    LocalDateTime claimedAt;
}

