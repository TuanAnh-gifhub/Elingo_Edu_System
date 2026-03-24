package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "wallet_transactions")
public class WalletTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "wallet_transaction_id")
    private UUID walletTransactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", length = 50, nullable = false)
    private WalletTxType type;

    @Column(name = "type", length = 50, nullable = false)
    private String legacyType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private WalletTxStatus status;

    @Column(name = "transaction_status", length = 20, nullable = false)
    private String legacyStatus;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "balance_before", precision = 19, scale = 2, nullable = false)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", precision = 19, scale = 2, nullable = false)
    private BigDecimal balanceAfter;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "booking_id")
    private UUID bookingId;

    @Column(name = "payos_order_code", unique = true)
    private String payosOrderCode;

    @Column(name = "payos_payment_link_id")
    private String payosPaymentLinkId;

    @Column(name = "withdraw_request_id")
    private UUID withdrawRequestId;

    @Lob
    @Column(name = "metadata")
    private String metadata;

    @PrePersist
    @PreUpdate
    private void syncLegacyType() {
        if (type != null) {
            this.legacyType = type.name();
        }
        if (status != null) {
            this.legacyStatus = status.name();
        }
    }
}

