package org.rent.room.be.repository;

import org.rent.room.be.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmailWithRole(@Param("email") String email);

    boolean existsByEmail(String email);

    User findByUserId(UUID id);

    Page<User> findAll(Specification<User> spec, Pageable pageable);

    @Query("SELECT u FROM User u JOIN u.role r WHERE r.roleName = 'TEACHER' AND u.active = true")
    List<User> findActiveTeachers(Sort sort);

    @Query("SELECT u FROM User u JOIN u.role r WHERE r.roleName = 'TEACHER' AND (:active IS NULL OR u.active = :active) AND (:keyword IS NULL OR LOWER(u.userName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findTeachers(@Param("active") Boolean active, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u JOIN u.role r WHERE r.roleName = 'TEACHER' AND u.active = true")
    long countActiveTeachers();
}
