package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.*;
import org.rent.room.be.base.BaseEntity;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Entity
@Table(name = "posts")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "post_id")
    UUID postId;

    @Column(name = "title", nullable = false)
    String title;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    String content;

    @Column(name = "post_status", length = 20)
    String postStatus;

    @Column(name = "post_user_name")
    String postUserName;

    @Column(name = "comment_on_post", columnDefinition = "TEXT")
    String commentOnPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id")
    RentalArea rentalArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @OneToMany(
            mappedBy = "post",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    List<Media> mediaList;
}