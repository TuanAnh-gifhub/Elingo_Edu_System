package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.response.CityResponse;
import org.rent.room.be.service.CityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/cities")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "9. City")
public class CityController {

    CityService cityService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CityResponse>>> getAllCities() {
        List<CityResponse> result = cityService.getAllCities();

        ApiResponse<List<CityResponse>> response = ApiResponse.<List<CityResponse>>builder()
                .code(200)
                .message("Get all cities successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }
}
