package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.springframework.data.domain.Auditable;

import java.io.Serializable;
import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Table(name = "notification")

public class Notification extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notification_id")
    private UUID notification_id;

    @Column(name = "notification_title",length = 100)
    private String notification_title;

    @Column(name = "notification_body", length = 255)
    private String notification_body;

    @ManyToOne(fetch  = FetchType.LAZY)
    private User sender_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private User recipient;

    @Column(name = "is_read")
    private boolean is_read;

    @Column(name = "is_deleted")
    private boolean is_deleted;

}
