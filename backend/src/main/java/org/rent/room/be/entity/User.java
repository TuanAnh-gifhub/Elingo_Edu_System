package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.*;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.AuthProvider;

import java.time.LocalDate;
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

    @Column(name = "password_hash")
    String passwordHash;

    @Column(name = "google_id", unique = true)
    String googleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider")
    AuthProvider provider;

    @Column(name = "phone_number", length = 20)
    String phone;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    Role role;

    @Column(name = "is_active")
    boolean active;

    @Builder.Default
    @Column(name = "email_verified")
    Boolean emailVerified = true;
}