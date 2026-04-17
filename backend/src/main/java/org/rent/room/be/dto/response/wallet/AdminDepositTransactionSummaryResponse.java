package org.rent.room.be.dto.response.wallet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDepositTransactionSummaryResponse {
    private long totalDeposits;
    private long completedDeposits;
    private long failedDeposits;
    private long pendingDeposits;
    private long cancelledDeposits;
}

