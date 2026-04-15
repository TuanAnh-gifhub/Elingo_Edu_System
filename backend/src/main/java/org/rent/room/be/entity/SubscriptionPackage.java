package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "subscription_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubscriptionPackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "package_id")
    UUID packageId;

    @Column(name = "name", nullable = false, length = 100)
    String name;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "price", precision = 19, scale = 2, nullable = false)
    BigDecimal price;

    @Column(name = "duration_days", nullable = false)
    int durationDays;

    @Column(name = "max_classes_per_month")
    Integer maxClassesPerMonth;

    @Column(name = "max_courses")
    Integer maxCourses;

    @Column(name = "is_active", nullable = false)
    boolean active = true;

    @OneToMany(mappedBy = "subscriptionPackage", fetch = FetchType.LAZY)
    List<UserSubscription> userSubscriptions;
}
