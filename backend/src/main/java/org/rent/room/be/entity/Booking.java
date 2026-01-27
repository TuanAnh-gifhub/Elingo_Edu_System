package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "bookings")
@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "booking_id")
    UUID bookingId;

    @Column(name = "booking_at", nullable = false)
    LocalDateTime bookingAt;

    @Column(name = "booking_status", length = 20)
    BookingStatus bookingStatus;

    @Column(name = "total_price", precision = 19, scale = 2)
    BigDecimal totalPrice;

    @Column(length = 500)
    String note;

    @Column(name = "check_in")
    LocalDateTime checkIn;

    @Column(name = "check_out")
    LocalDateTime checkOut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renter_id")
    User renter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id")
    Wallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    Review review;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    List<Slot> slots;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    List<ScheduleBooking> scheduleBookings;
}