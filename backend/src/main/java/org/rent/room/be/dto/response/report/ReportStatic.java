package org.rent.room.be.dto.response.report;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReportStatic {
    private int countTotal;
    private int countPending;
    private int countResolved;
    private int countRejected;
}
