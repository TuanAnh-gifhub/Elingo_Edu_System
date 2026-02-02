package org.rent.room.be.specification;

import jakarta.persistence.criteria.Predicate;
import org.rent.room.be.constant.ReportStatus;
import org.rent.room.be.entity.Report;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;


public class ReportSpecification {

    public static Specification<Report> filter(
            ReportStatus status,
            String keyword,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }


            if (keyword != null && !keyword.isBlank()) {
                predicates.add(
                        cb.like(
                                cb.function(
                                        "unaccent",
                                        String.class,
                                        cb.lower(root.get("title"))
                                ),
                                "%" + keyword.toLowerCase() + "%"
                        )
                );

            }

            if (fromDate != null) {
                predicates.add(
                        cb.greaterThanOrEqualTo(
                                root.get("createdAt"),
                                fromDate.atStartOfDay()
                        )
                );
            }

            if (toDate != null) {
                predicates.add(
                        cb.lessThanOrEqualTo(
                                root.get("createdAt"),
                                toDate.atTime(LocalTime.MAX)
                        )
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
