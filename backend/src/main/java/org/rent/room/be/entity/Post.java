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
@Table(name = "post")
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "post_id")
    private UUID postId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;


    @Column(name = "post_status")
    private String postStatus;

    @Column(name = "post_user_name")
    private String postUserName;

    @Column(name = "comment_on_post")
    private String commentOnPost;

    private String emotion;

    @Column(name = "total_vote")
    private Integer totalVote;

    @Column(name = "area_id")
    private Integer areaId;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;


    @OneToMany(
            mappedBy = "post",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<Media> mediaList;
}

