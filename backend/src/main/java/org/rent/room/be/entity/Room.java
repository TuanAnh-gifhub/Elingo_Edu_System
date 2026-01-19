package org.rent.room.be.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.List;
import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "room")
@SuperBuilder
public class Room extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "room_id")
    private UUID id;

    @Column(name = "room_name" ,length = 50)
    private  String room_name;

    @Column(name = "price")
    private  double price;

    @Column(name = "description" ,length = 255)
    private  String description;

    @Column(name = "room_status" ,length = 30)
    private  String room_status;

    @Column(name = "acreage" ,length = 50)
    private String acreage;

    @OneToMany(mappedBy = "room", fetch =  FetchType.LAZY)
    private List<Amenity> amenities;

    @ManyToOne
    @JoinColumn(name = "category_id", referencedColumnName = "category_id")
    private Category category;

    @OneToMany(mappedBy= "roomReport",fetch =  FetchType.LAZY)
    private List<Report> reports;

}
