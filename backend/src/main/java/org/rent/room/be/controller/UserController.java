package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.user.CreateUsersRequest;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PACKAGE, makeFinal = true)
@RequestMapping("/users")
@Tag(name = "2. User", description = "API quản lý người dùng")
public class UserController {

    UserService userService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<?>> createUser(@RequestBody CreateUsersRequest user) {
        UserResponse users = userService.createUser(user);
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Create user successfully")
                        .result(users)
                        .build()
        );
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfileUser() {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Get my info successfully")
                        .result(userService.getProfileUser())
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<?>> getAllUsers(@RequestParam(defaultValue = "1",required = false )int page,
                                                      @RequestParam(defaultValue = "10", required = false) int size) {
        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .code(200)
                        .message("Get all user successfully")
                        .result(userService.getAllUsers(page,size))
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/username")
    public ResponseEntity<ApiResponse<?>> getUserByUsername(@RequestParam String username) {
        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .code(200)
                        .message("Get user by username successfully")
                        .result(userService.getAllUsersByName(username))
                        .build()
        );
    }
}
