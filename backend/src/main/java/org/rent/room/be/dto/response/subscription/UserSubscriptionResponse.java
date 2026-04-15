package org.rent.room.be.dto.response.subscription;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSubscriptionResponse {

    UUID subscriptionId;
    UUID userId;
    String userName;
    String userEmail;
    UUID packageId;
    String packageName;
    BigDecimal amountPaid;
    LocalDateTime startDate;
    LocalDateTime endDate;
    SubscriptionStatus status;
    LocalDateTime createdAt;
}
