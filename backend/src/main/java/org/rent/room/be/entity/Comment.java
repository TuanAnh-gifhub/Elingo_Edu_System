package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Comment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "comment_id")
    UUID commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    Comment parentComment;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    String content;

    @ElementCollection
    @CollectionTable(name = "comment_images", joinColumns = @JoinColumn(name = "comment_id"))
    @Column(name = "image_url", length = 500)
    @Builder.Default
    List<String> images = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "comment_videos", joinColumns = @JoinColumn(name = "comment_id"))
    @Column(name = "video_url", length = 500)
    @Builder.Default
    List<String> videos = new ArrayList<>();

    @Column(name = "like_count")
    @Builder.Default
    Integer likeCount = 0;

    @Column(name = "is_active")
    @Builder.Default
    boolean active = true;
}
