package org.rent.room.be.dto.request.payment;

import lombok.Getter;
import org.rent.room.be.constant.PaymentMethod;

import java.util.UUID;

@Getter
public class CheckoutRequest {
    private UUID bookingIntentId;
    private PaymentMethod paymentMethod;
}

