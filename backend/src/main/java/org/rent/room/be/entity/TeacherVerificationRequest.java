package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.TeacherVerificationStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "teacher_verification_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherVerificationRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(nullable = false, length = 120)
    String fullName;

    @Column(nullable = false, length = 100)
    String email;

    @Column(length = 20)
    String phone;

    @Column(length = 500)
    String bio;

    @Column(length = 500)
    String expertise;

    @Column(length = 1000)
    String experience;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "teacher_verification_certificates", joinColumns = @JoinColumn(name = "verification_request_id"))
    @Column(name = "file_url", nullable = false, length = 1000)
    List<String> certificateFiles = new ArrayList<>();

    @Column(length = 500)
    String portfolioLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    TeacherVerificationStatus status;

    @Column(length = 1000)
    String adminNote;
}

