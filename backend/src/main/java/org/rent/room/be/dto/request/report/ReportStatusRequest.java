package org.rent.room.be.dto.request.report;

import lombok.Getter;
import lombok.Setter;
import org.rent.room.be.constant.ReportStatus;

@Getter
@Setter
public class ReportStatusRequest {
  private ReportStatus reportStatus;
  private String userName;
  private String email;
  private String content;
}
