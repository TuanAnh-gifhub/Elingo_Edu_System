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
@Table(name = "platform_commission_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PlatformCommissionConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "config_id")
    UUID configId;

    @Column(name = "commission_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    CommissionType commissionType;

    @Column(name = "commission_rate", precision = 5, scale = 2)
    BigDecimal commissionRate;

    @Column(name = "fixed_amount", precision = 10, scale = 2)
    BigDecimal fixedAmount;

    @Column(name = "effective_from", nullable = false)
    LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    LocalDateTime effectiveTo;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "is_active")
    @Builder.Default
    boolean active = true;

    public enum CommissionType {
        PERCENTAGE,
        FIXED_AMOUNT,
        PERCENTAGE_WITH_MINIMUM,
        PERCENTAGE_WITH_MAXIMUM
    }
}
