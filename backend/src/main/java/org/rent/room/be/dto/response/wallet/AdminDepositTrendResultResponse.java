package org.rent.room.be.dto.response.wallet;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminDepositTrendResultResponse {

    String fromDate;
    String toDate;
    BigDecimal totalAmount;
    Long totalDepositingUsers;
    List<AdminDepositTrendBucketResponse> daily;
    List<AdminDepositTrendBucketResponse> monthly;
}

