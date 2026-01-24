package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.BookingStatus;
// import org.rent.room.be.base.BaseEntity; // Xem mục 1 bên dưới

import java.math.BigDecimal; // Import quan trọng cho tiền tệ
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "bookings") // Đổi thành số nhiều cho đồng bộ với users/amenities
@Entity
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "booking_id")
    private UUID bookingId;

    @Column(name = "booking_at", nullable = false)
    private LocalDateTime bookingAt;

    @Column(name = "booking_status", length = 20)
    private BookingStatus bookingStatus;

    @Column(name = "total_price", precision = 19, scale = 2)
    private BigDecimal totalPrice;

    @Column(length = 500)
    private String note;

    @Column(name = "check_in")
    private LocalDateTime checkIn;

    @Column(name = "check_out")
    private LocalDateTime checkOut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renter_id")
    private User renter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id")
    private Wallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private Review review;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    private List<Slot> slots;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY)
    private List<ScheduleBooking> scheduleBookings;
}