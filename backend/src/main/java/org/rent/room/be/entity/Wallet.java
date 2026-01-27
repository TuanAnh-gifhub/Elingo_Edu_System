package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.WalletStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Entity
@Table(name = "wallets")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Wallet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "wallet_id")
    UUID walletId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    User user;

    @Column(name = "balance", precision = 19, scale = 2)
    BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "wallet_status", length = 20)
    WalletStatus walletStatus;

    @OneToMany(mappedBy = "wallet", fetch = FetchType.LAZY)
    List<Payment> payments;

    @OneToMany(mappedBy = "wallet", fetch = FetchType.LAZY)
    List<Order> orders;
}