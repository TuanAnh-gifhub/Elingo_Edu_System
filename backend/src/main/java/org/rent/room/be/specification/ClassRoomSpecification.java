package org.rent.room.be.specification;

import jakarta.persistence.criteria.Predicate;
import org.rent.room.be.entity.ClassRoom;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ClassRoomSpecification {

    public static Specification<ClassRoom> filterClasses(String keyword, UUID teacherId, Boolean active) {
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

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}

