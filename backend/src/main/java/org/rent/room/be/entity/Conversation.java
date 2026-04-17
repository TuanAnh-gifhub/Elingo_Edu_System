package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.ConversationType;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "conversations")
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Conversation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "conversation_id")
    UUID conversationId;

    @Column(name = "conversation_title", length = 200)
    String conversationTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "conversation_type", nullable = false, length = 30)
    @Builder.Default
    ConversationType conversationType = ConversationType.DIRECT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1", referencedColumnName = "user_id")
    User user1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2", referencedColumnName = "user_id")
    User user2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", referencedColumnName = "class_id")
    ClassRoom classRoom;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "conversation_participants",
            joinColumns = @JoinColumn(name = "conversation_id")
    )
    @Column(name = "user_id", nullable = false)
    @Builder.Default
    Set<UUID> participantUserIds = new HashSet<>();

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    List<Message> messages;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "conversation_hidden_users",
            joinColumns = @JoinColumn(name = "conversation_id")
    )
    @Column(name = "user_id", nullable = false)
    @Builder.Default
    Set<UUID> hiddenByUserIds = new HashSet<>();
}

