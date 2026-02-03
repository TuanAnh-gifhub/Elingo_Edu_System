package org.rent.room.be.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
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
@ToString(exclude = {"subscriptions","orders"})
@Entity
@Table(name = "packages") // Tên bảng số nhiều

public class RentPackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "package_id")
    private UUID rentPackageId;

    @Column(unique = true, name = "package_name", length = 50)
    private String rentPackageName;


    @Column(name = "price", precision = 19, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    @OneToMany(mappedBy = "servicePackage", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Subscription> subscriptions;

    @OneToMany(mappedBy = "servicePackage", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Order> orders;
}