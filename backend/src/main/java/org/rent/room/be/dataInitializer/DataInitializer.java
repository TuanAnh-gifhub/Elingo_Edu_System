package org.rent.room.be.dataInitializer;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.constant.Role;
import org.rent.room.be.entity.Amenity;
import org.rent.room.be.entity.Category;
import org.rent.room.be.entity.City;
import org.rent.room.be.entity.User;
import org.rent.room.be.repository.AmenityRepository;
import org.rent.room.be.repository.CategoryRepository;
import org.rent.room.be.repository.CityRepository;
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
    CityRepository cityRepository;
    CategoryRepository categoryRepository;
    AmenityRepository amenityRepository;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedCities();
        seedCategories();
        seedAmenities();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;

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

        userRepository.saveAll(List.of(user1, user2, user3, user4));
    }


    private void seedCities() {
        List<String> cities = List.of(
                "TP. Hồ Chí Minh",
                "Hà Nội",
                "Đà Nẵng",
                "Cần Thơ"
        );

        for (String name : cities) {
            if (!cityRepository.existsByCityName(name)) {
                cityRepository.save(City.builder()
                        .cityName(name)
                        .build());
            }
        }
    }

    private void seedCategories() {
        List<String> categories = List.of(
                "Phòng học",
                "Phòng họp",
                "Phòng lab",
                "Phòng nhóm",
                "Phòng thuyết trình",
                "Phòng thí nghiệm"
        );

        for (String name : categories) {
            if (!categoryRepository.existsByCategoryName(name)) {
                categoryRepository.save(Category.builder()
                        .categoryName(name)
                        .build());
            }
        }
    }

    private void seedAmenities() {
        List<String> amenities = List.of(
                "Wifi",
                "Ổ điện",
                "Máy lạnh",
                "Máy chiếu",
                "Bảng trắng",
                "Micro",
                "Loa",
                "Nước uống"
        );

        for (String name : amenities) {
            if (!amenityRepository.existsByAmenityName(name)) {
                amenityRepository.save(Amenity.builder()
                        .amenityName(name)
                        .build());
            }
        }
    }
}
