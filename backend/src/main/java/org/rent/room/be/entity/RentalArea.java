package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "rental_areas")
@Entity
public class RentalArea extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rental_area_id")
    private UUID rentalAreaId;

    @Column(name = "rental_area_name", length = 100, nullable = false)
    private String rentalAreaName;

    @Column(name = "address_detail", length = 255, nullable = false)
    private String addressDetail;

    @Column(name = "ward", length = 100)
    private String ward;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "rental_area_type", length = 50)
    private String rentalAreaType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Builder.Default
    @Column(name = "country", length = 50)
    private String country = "Việt Nam";

}