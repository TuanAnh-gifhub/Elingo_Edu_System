package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.WithdrawStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "withdraw_requests")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WithdrawRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "withdraw_request_id")
    UUID withdrawRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    Wallet wallet;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    BigDecimal amount;

    @Column(name = "bank_code", length = 50)
    String bankCode;

    @Column(name = "bank_account_number", length = 50)
    String bankAccountNumber;

    @Column(name = "bank_account_name", length = 100)
    String bankAccountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    WithdrawStatus status;

    @Column(name = "admin_note", length = 255)
    String adminNote;

    @Column(name = "processed_by")
    UUID processedBy;

    @Column(name = "processed_at")
    LocalDateTime processedAt;
}

