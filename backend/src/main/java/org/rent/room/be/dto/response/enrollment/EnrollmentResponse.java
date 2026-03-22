package org.rent.room.be.dto.response.enrollment;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.entity.Enrollment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class EnrollmentResponse {

    UUID enrollmentId;
    UUID studentId;
    String studentName;
    UUID classId;
    String className;
    LocalDateTime enrollmentDate;
    BigDecimal price;
    BigDecimal paymentAmount;
    Enrollment.PaymentStatus paymentStatus;
    LocalDateTime paymentDate;
    String transactionId;
    String notes;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
