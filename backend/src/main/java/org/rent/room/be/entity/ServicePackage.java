package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
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
@Table(name = "packages") // Tên bảng số nhiều
public class ServicePackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "package_id")
    private UUID packageId;

    @Column(name = "package_name", length = 50, nullable = false, unique = true) // Thêm unique
    private String packageName;

    @Column(name = "price", precision = 19, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    @OneToMany(mappedBy = "servicePackage", fetch = FetchType.LAZY)
    private List<Subscription> subscriptions;

    @OneToMany(mappedBy = "servicePackage", fetch = FetchType.LAZY)
    private List<Order> orders;
}