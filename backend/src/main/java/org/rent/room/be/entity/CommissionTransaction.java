package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "commission_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommissionTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "commission_id")
    UUID commissionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    PlatformCommissionConfig commissionConfig;

    @Column(name = "original_amount", nullable = false, precision = 10, scale = 2)
    BigDecimal originalAmount;

    @Column(name = "commission_rate", precision = 5, scale = 2)
    BigDecimal commissionRate;

    @Column(name = "commission_amount", nullable = false, precision = 10, scale = 2)
    BigDecimal commissionAmount;

    @Column(name = "teacher_received_amount", nullable = false, precision = 10, scale = 2)
    BigDecimal teacherReceivedAmount;

    @Column(name = "commission_date", nullable = false)
    LocalDateTime commissionDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    String notes;
}
