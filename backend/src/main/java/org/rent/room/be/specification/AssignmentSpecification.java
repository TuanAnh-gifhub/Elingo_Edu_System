package org.rent.room.be.specification;

import jakarta.persistence.criteria.Predicate;
import org.rent.room.be.entity.Assignment;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AssignmentSpecification {

    public static Specification<Assignment> classIdIn(List<UUID> classIds) {
        return (root, query, criteriaBuilder) -> {
            if (classIds == null || classIds.isEmpty()) {
                return criteriaBuilder.disjunction();
            }
            return root.get("classRoom").get("classId").in(classIds);
        };
    }

    public static Specification<Assignment> filterAssignments(
            UUID classId,
            UUID teacherId,
            String keyword,
            LocalDateTime deadlineFrom,
            LocalDateTime deadlineTo,
            Boolean active
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (classId != null) {
                predicates.add(criteriaBuilder.equal(root.get("classRoom").get("classId"), classId));
            }

            if (teacherId != null) {
                predicates.add(criteriaBuilder.equal(root.get("teacher").get("userId"), teacherId));
            }

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                Predicate titleLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern);
                Predicate descLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern);
                predicates.add(criteriaBuilder.or(titleLike, descLike));
            }

            if (deadlineFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("deadline"), deadlineFrom));
            }

            if (deadlineTo != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("deadline"), deadlineTo));
            }

            if (active != null) {
                predicates.add(criteriaBuilder.equal(root.get("active"), active));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}

