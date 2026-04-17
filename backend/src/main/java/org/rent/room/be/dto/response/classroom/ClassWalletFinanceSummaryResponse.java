package org.rent.room.be.dto.response.classroom;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassWalletFinanceSummaryResponse {

    UUID classId;
    BigDecimal classWalletBalance;
    BigDecimal platformUpcomingProfit;
    BigDecimal platformReceivedProfit;
    BigDecimal teacherUpcomingReceivable;
    BigDecimal teacherReceivedAmount;
    BigDecimal feePercent;
}

