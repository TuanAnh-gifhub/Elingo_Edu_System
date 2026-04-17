package org.rent.room.be.specification;

import jakarta.persistence.criteria.Predicate;
import org.rent.room.be.entity.ClassRoom;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ClassRoomSpecification {

    public static Specification<ClassRoom> filterClasses(
            String keyword,
            UUID teacherId,
            Boolean active,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String studyDay,
            String studyHour
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String searchPattern = "%" + keyword.toLowerCase() + "%";
                Predicate classNameLike = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("className")),
                        searchPattern
                );
                Predicate descriptionLike = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("description")),
                        searchPattern
                );
                predicates.add(criteriaBuilder.or(classNameLike, descriptionLike));
            }

            if (teacherId != null) {
                predicates.add(criteriaBuilder.equal(root.get("teacher").get("userId"), teacherId));
            }

            if (active != null) {
                predicates.add(criteriaBuilder.equal(root.get("active"), active));
            }

            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (StringUtils.hasText(studyDay)) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("schedule")),
                        "%" + studyDay.trim().toLowerCase() + "%"
                ));
            }

            if (StringUtils.hasText(studyHour)) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("schedule")),
                        "%" + studyHour.trim().toLowerCase() + "%"
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}

