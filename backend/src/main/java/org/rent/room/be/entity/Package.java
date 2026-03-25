package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Package extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "package_id")
    UUID packageId;

    @Column(name = "name", nullable = false, length = 100)
    String name;

    @Column(name = "description")
    String description;

    @Column(name = "price", nullable = false)
    Double price;

    @Column(name = "duration_in_days", nullable = false)
    Integer durationInDays;
}

