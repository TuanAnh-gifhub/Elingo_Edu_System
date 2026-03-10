package org.rent.room.be.repository;

import org.rent.room.be.constant.BookingStatus;
import org.rent.room.be.entity.Booking;
import org.rent.room.be.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    Page<Booking> findByBookingStatusAndEscrowReleasedAtIsNull(BookingStatus bookingStatus, Pageable pageable);

    Page<Booking> findByRenterAndBookingStatusAndEscrowReleasedAtIsNull(User renter, BookingStatus bookingStatus, Pageable pageable);
}

