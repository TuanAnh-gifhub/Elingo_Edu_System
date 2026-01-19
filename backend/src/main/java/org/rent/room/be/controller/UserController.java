package org.rent.room.be.controller;




import jakarta.servlet.http.HttpServletRequest;
import org.rent.room.be.base.StandardResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    @GetMapping("/user/info")
    public ResponseEntity<StandardResponse<?>> getUserInfo(HttpServletRequest request) {

        StandardResponse<?> response = StandardResponse.builder()
                .code(1000)
                .message("a")
                .result("User info accessed successfully")
                .build();

        return ResponseEntity.ok(response);
    }

}
