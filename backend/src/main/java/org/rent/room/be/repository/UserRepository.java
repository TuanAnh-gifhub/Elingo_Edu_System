package org.rent.room.be.repository;

import io.micrometer.observation.ObservationFilter;
import org.rent.room.be.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    User findByUserId(UUID id);

    List<User> findByUserName(String username);
}
