package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.BookingIntentStatus;
import org.rent.room.be.constant.BookingStatus;
import org.rent.room.be.dto.response.booking.BookingResponse;
import org.rent.room.be.entity.Booking;
import org.rent.room.be.entity.BookingIntent;
import org.rent.room.be.entity.Payment;
import org.rent.room.be.repository.BookingIntentRepository;
import org.rent.room.be.repository.BookingRepository;
import org.rent.room.be.service.BookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingIntentRepository bookingIntentRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional
    public BookingResponse createBooking(UUID bookingIntentId, Payment payment) throws IOException {
        BookingIntent intent = bookingIntentRepository.findById(bookingIntentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking intent"));
        if (intent.getStatus() == BookingIntentStatus.CONFIRMED) {
            // idempotency: allow caller to short-circuit using payment.bookingId, but still safe here
        }

        Booking booking = Booking.builder()
                .renter(intent.getUser())
                .totalPrice(intent.getPreviewPrice())
                .bookingStatus(BookingStatus.BOOKED)
                .checkIn((LocalDateTime) null)
                .checkOut((LocalDateTime) null)
                .build();

        Booking saved = bookingRepository.save(booking);

        return BookingResponse.builder()
                .bookingId(saved.getBookingId())
                .status(saved.getBookingStatus())
                .totalPrice(saved.getTotalPrice())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}

