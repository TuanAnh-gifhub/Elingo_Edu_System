package org.rent.room.be.repository;

import org.rent.room.be.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID>, JpaSpecificationExecutor<Report>{

    @Query(value = """
      Select  
         COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END),0) AS resolved,
        COALESCE(SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) ,0) AS rejected
      from report
""" ,nativeQuery = true)
   Object[] countAllStatus();
}
