package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.*;
import org.rent.room.be.base.BaseEntity;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "rental_areas")
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RentalArea extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rental_area_id")
    UUID rentalAreaId;

    @Column(name = "rental_area_name", length = 100, nullable = false)
    String rentalAreaName;

    @Column(name = "address_detail", length = 255, nullable = false)
    String addressDetail;

    @Column(name = "ward", length = 100)
    String ward;

    @Column(name = "district", length = 100)
    String district;

    @Column(name = "rental_area_type", length = 50)
    String rentalAreaType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    City city;

    @Builder.Default
    @Column(name = "country", length = 50)
    String country = "Việt Nam";

}