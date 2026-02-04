package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.RentalAreaStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "rental_areas")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RentalArea extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rental_area_id")
    UUID rentalAreaId;

    @Column(name = "rental_area_name", length = 150, nullable = false)
    String rentalAreaName;

    @Column(name = "address", length = 255, nullable = false)
    String address;

    @Column(name = "contact_name", length = 100)
    String contactName;

    @Column(name = "contact_phone", length = 20)
    String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    RentalAreaStatus status;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    City city;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    User owner;
}