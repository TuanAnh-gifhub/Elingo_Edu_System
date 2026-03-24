package org.rent.room.be.service;

import org.rent.room.be.dto.response.booking.BookingResponse;
import org.rent.room.be.entity.Payment;

import java.io.IOException;
import java.util.UUID;

public interface BookingService {

    BookingResponse createBooking(UUID bookingIntentId, Payment payment) throws IOException;
}

