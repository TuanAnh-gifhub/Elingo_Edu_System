package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1", referencedColumnName = "user_id")
    User user1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2", referencedColumnName = "user_id")
    User user2;

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

