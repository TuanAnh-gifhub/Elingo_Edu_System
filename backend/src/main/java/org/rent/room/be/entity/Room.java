package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.RoomStatus;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "rooms")
@SuperBuilder
public class Room extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "room_name", length = 100, nullable = false)
    private String roomName;


    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "room_status", length = 30)
    private RoomStatus roomStatus;

    @Column(name = "area")
    private Double area;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "room_amenities",
            joinColumns = @JoinColumn(name = "room_id"),
            inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    private Set<Amenity> amenities = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id", nullable = false)
    private RentalArea rentalArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

//    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY)
//    private List<Report> reports;

    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY)
    private List<Slot> slots;
}