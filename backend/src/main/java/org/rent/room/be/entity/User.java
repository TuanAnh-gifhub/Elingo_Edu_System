package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.*;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.Role;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    UUID userId;

    @Column(name = "user_name", nullable = false, length = 100)
    String userName;

    @Column(name = "gender")
    String gender;

    @Column(nullable = false, unique = true, length = 100)
    String email;

    @Column(name = "password_hash", nullable = false)
    String passwordHash;

    @Column(name = "phone_number", length = 20)
    String phone;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    Role role;

    @Column(name = "is_active")
    boolean active;

    @OneToMany(mappedBy = "recipient", fetch = FetchType.LAZY)
    List<Notification> notifications;

    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Conversation> conversation;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    List<Subscription> subscriptions;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    List<Payment> payments;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    Wallet wallet;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    List<Report> reports;
}