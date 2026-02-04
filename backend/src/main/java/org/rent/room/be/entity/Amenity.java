package org.rent.room.be.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.Set;
import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Table(name = "amenity")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Amenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "amenity_id")
    Long amenityId;

    @Column(name = "amenity_name", length = 100, nullable = false, unique = true)
    String amenityName;

    @ManyToMany(mappedBy = "amenities", fetch = FetchType.LAZY)
    Set<Room> rooms;
}
