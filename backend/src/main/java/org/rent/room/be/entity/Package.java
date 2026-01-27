package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Entity
@Table(name = "packages")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServicePackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "package_id")
    UUID packageId;

    @Column(name = "package_name", length = 50, nullable = false, unique = true) // Thêm unique
    String packageName;

    @Column(name = "price", precision = 19, scale = 2, nullable = false)
    BigDecimal price;

    @Column(name = "duration_days", nullable = false)
    int durationDays;

    @OneToMany(mappedBy = "servicePackage", fetch = FetchType.LAZY)
    List<Subscription> subscriptions;

    @OneToMany(mappedBy = "servicePackage", fetch = FetchType.LAZY)
    List<Order> orders;
}