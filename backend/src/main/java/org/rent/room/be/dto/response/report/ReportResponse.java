package org.rent.room.be.dto.response.report;

import lombok.*;
import org.rent.room.be.constant.ReportStatus;
import org.rent.room.be.dto.response.UserResponse;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReportResponse {
    private UUID reportId;
    private String title;
    private String content;
    private ReportStatus status;
    private String address;
    private UserResponse user;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


}
