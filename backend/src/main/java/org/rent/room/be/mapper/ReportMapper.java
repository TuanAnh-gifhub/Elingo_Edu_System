package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.report.ReportResponse;
import org.rent.room.be.entity.Report;

import java.util.List;

@Mapper(componentModel = "spring",uses = {UserMapper.class})
public interface ReportMapper {
    ReportResponse toReportResponse(Report report);
    List<ReportResponse> toMapperReportListResponse(List<Report> reports);
}
