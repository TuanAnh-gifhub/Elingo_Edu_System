package org.rent.room.be.dto.request.report;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.rent.room.be.constant.ReportStatus;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ReportRequest {
    private String title;
    private String content;
    private UUID reportId;
    private ReportStatus reportStatus;
    private String email;
}
