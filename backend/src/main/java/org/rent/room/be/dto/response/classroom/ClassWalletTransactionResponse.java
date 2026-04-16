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
public class ClassWalletTransactionResponse {

    UUID transactionId;
    String transactionType;
    BigDecimal amount;
    LocalDateTime transactionTime;
    String studentName;
    String description;
}

