package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.*;
import org.rent.room.be.base.BaseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Table(name = "schedules", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "specific_date"})
})
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Schedule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "schedule_id")
    UUID scheduleId;

    @Column(name = "specific_date", nullable = false)
    LocalDate specificDate;

    @Column(name = "availability_status", length = 20)
    String availabilityStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    Room room;

    @OneToMany(
            mappedBy = "schedule",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    List<Slot> slots;

    @OneToMany(mappedBy = "schedule", fetch = FetchType.LAZY)
    List<ScheduleBooking> scheduleBookings;
}