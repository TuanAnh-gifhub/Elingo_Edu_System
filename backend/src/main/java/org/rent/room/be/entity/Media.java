package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity; // Nên thêm cái này

import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Entity
@Table(name = "media")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Media extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "media_id")
    UUID mediaId;

    @Column(name = "media_type", length = 20)
    String mediaType;

    @Column(name = "media_url", nullable = false, columnDefinition = "TEXT")
    String mediaUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    Post post;
}