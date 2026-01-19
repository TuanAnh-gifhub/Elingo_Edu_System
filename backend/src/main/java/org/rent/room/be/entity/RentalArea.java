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
@Table(name = "rental_area")
@Entity
public class RentalArea extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rental_area_id")
    private UUID rentalAreaId;

    @Column(name = "rental_area_name", length = 100)
    private  String rentalAreaName;

    @Column(name = "address_detail", length = 255)
    private  String addressDetail;

    @Column(name = "ward", length = 100)
    private String ward;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "type_rental_area", length = 50)
    private  String type_rental_area;

    @ManyToOne
    @JoinColumn(name = "city_id", referencedColumnName = "city_id")
    private City city;

    @Builder.Default
    private String country = "Việt Nam";

}
