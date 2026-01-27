package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Table(name = "categories")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    Integer categoryId;

    @Column(name = "category_name", length = 50, nullable = false, unique = true)
    String categoryName;

    @Column(name = "description", length = 255)
    String description;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    List<Room> rooms;

}