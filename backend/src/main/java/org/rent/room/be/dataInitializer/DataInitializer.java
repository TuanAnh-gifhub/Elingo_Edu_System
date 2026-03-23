package org.rent.room.be.dataInitializer;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.entity.Role;
import org.rent.room.be.entity.User;
import org.rent.room.be.repository.RoleRepository;
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
    RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
    }

    private void seedUsers() {
        Role adminRole = createRoleIfNotExist("ADMIN", "Quản trị hệ thống");
        Role ownerRole = createRoleIfNotExist("TEACHER", "Giáo viên");
        Role renterRole = createRoleIfNotExist("STUDENT", "Học sinh");

        if (userRepository.count() > 0) return;
        User user1 = User.builder()
                .userName("StudentName")
                .gender("Male")
                .email("student@gmail.com")
                .passwordHash(passwordEncoder.encode("12345678"))
                .phone("0987654321")
                .dateOfBirth(LocalDate.of(2000, 1, 2))
                .role(renterRole)
                .active(true).build();

        User user2 = User.builder()
                .userName("TeacherName")
                .gender("Female")
                .email("teacher@gmail.com")
                .passwordHash(passwordEncoder.encode("12345678"))
                .phone("0123456789")
                .dateOfBirth(LocalDate.of(1990, 1, 2))
                .role(ownerRole)
                .active(true).build();

        User user3 = User.builder()
                .userName("AdminName")
                .gender("Other")
                .email("admin@gmail.com")
                .passwordHash(passwordEncoder.encode("12345678"))
                .phone("1234567890")
                .dateOfBirth(LocalDate.of(2008, 1, 2))
                .role(adminRole)
                .active(true).build();

        userRepository.saveAll(List.of(user1, user2, user3));
    }


    private Role createRoleIfNotExist(String roleName, String description) {
        return roleRepository.findByRoleName(roleName)
                .orElseGet(() -> roleRepository.save(
                        org.rent.room.be.entity.Role.builder()
                                .roleName(roleName)
                                .description(description)
                                .active(true)
                                .build()
                ));
    }

}
