package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
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
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "post_id")
    private UUID postId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "post_status", length = 20)
    private String postStatus;

    @Column(name = "post_user_name")
    private String postUserName;

    @Column(name = "comment_on_post", columnDefinition = "TEXT")
    private String commentOnPost;

    @Column(name = "emotion", length = 50)
    private String emotion;

    @Column(name = "total_vote")
    private Integer totalVote = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id")
    private RentalArea rentalArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(
            mappedBy = "post",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<Media> mediaList;
}