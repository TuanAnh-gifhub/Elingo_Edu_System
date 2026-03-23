package org.rent.room.be.dto.request.enrollment;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class CreateEnrollmentRequest {

    UUID studentId;
    UUID classId;
    BigDecimal paymentAmount;
    String transactionId;
    String notes;
}
