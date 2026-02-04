package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "room_images")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomImage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "room_image_id")
    UUID roomImageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    Room room;

    @Column(name = "image_url", length = 500, nullable = false)
    String imageUrl;

    @Column(name = "public_id", length = 255, nullable = false)
    String publicId;

    @Builder.Default
    @Column(name = "is_cover", nullable = false)
    Boolean isCover = false;

    @Column(name = "sort_order")
    Integer sortOrder;
}
