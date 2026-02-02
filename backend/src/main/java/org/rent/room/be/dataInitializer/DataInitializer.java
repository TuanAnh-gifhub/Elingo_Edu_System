package org.rent.room.be.dataInitializer;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.Role;
import org.rent.room.be.entity.User;
import org.rent.room.be.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DataInitializer implements CommandLineRunner {

    PasswordEncoder passwordEncoder;
    UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {

        User user1 = User.builder()
                .userName("RenterName")
                .gender("Male")
                .email("renter@gmail.com")
                .passwordHash(passwordEncoder.encode("12345678"))
                .phone("0987654321")
                .dateOfBirth(LocalDate.of(2000, 1, 2))
                .role(Role.RENTER)
                .active(true).build();

        User user2 = User.builder()
                .userName("OwnerName")
                .gender("Female")
                .email("owner@gmail.com")
                .passwordHash(passwordEncoder.encode("12345678"))
                .phone("0123456789")
                .dateOfBirth(LocalDate.of(1990, 1, 2))
                .role(Role.OWNER)
                .active(true).build();

        User user3 = User.builder()
                .userName("AdminName")
                .gender("Other")
                .email("admin@gmail.com")
                .passwordHash(passwordEncoder.encode("12345678"))
                .phone("1234567890")
                .dateOfBirth(LocalDate.of(2008, 1, 2))
                .role(Role.ADMIN)
                .active(true).build();

        User user4 = User.builder()
                .userName("Quang")
                .gender("Other")
                .email("quang@gmail.com")
                .passwordHash(passwordEncoder.encode("12345678"))
                .phone("1234567890")
                .dateOfBirth(LocalDate.of(2004, 1, 2))
                .role(Role.ADMIN)
                .active(true).build();


        if (userRepository.count() == 0) {
            userRepository.saveAll(List.of(user1, user2, user3,user4));
        }
    }
}
