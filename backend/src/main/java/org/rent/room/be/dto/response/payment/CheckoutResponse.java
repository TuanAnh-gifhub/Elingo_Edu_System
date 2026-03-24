package org.rent.room.be.dto.response.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponse {
    private String mode;
    private String paymentStatus;
    private UUID bookingId;
    private String paymentUrl;
    private String orderCode;
    private String message;
}

