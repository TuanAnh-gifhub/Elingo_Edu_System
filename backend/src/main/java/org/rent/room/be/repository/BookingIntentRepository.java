package org.rent.room.be.repository;

import org.rent.room.be.entity.BookingIntent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BookingIntentRepository extends JpaRepository<BookingIntent, UUID> {
}

