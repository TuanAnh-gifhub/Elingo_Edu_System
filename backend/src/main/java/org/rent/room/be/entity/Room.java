package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
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
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Room extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "room_id")
    UUID roomId;

    @Column(name = "room_name", length = 100, nullable = false)
    String roomName;

    @Column(name = "price", precision = 19, scale = 2, nullable = false)
    BigDecimal price;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "room_status", length = 30)
    RoomStatus roomStatus;

    @Column(name = "area")
    Double area;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "room_amenities",
            joinColumns = @JoinColumn(name = "room_id"),
            inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    Set<Amenity> amenities = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id", nullable = false)
    RentalArea rentalArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Category category;

    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY)
    List<Report> reports;

    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY)
    List<Slot> slots;
}