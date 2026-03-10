package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "bookings")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "booking_id")
    UUID bookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renter_id", nullable = false)
    User renter;

    @Column(name = "total_price", precision = 19, scale = 2, nullable = false)
    BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status", length = 20, nullable = false)
    BookingStatus bookingStatus = BookingStatus.BOOKED;

    @Column(name = "check_in")
    LocalDateTime checkIn;

    @Column(name = "check_out")
    LocalDateTime checkOut;

    @Column(name = "escrow_released_at")
    LocalDateTime escrowReleasedAt;

    @Column(name = "dispute_flag")
    Boolean disputeFlag;

    @Column(name = "dispute_note", length = 255)
    String disputeNote;
}

