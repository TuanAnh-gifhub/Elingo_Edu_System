package org.rent.room.be.common;

import org.rent.room.be.base.ApiResponse;
import org.springframework.http.ResponseEntity;
import java.net.URI;

// Tạo file: common/ResponseBuilder.java
public class ResponseBuilder {
    public static <T> ResponseEntity<ApiResponse<T>> success(T data, String message) {
        return ResponseEntity.ok(
                ApiResponse.<T>builder()
                        .code(200)
                        .message(message)
                        .result(data)
                        .build()
        );
    }

    public static <T> ResponseEntity<ApiResponse<T>> created(T data, String uri) {
        return ResponseEntity.created(URI.create(uri))
                .body(ApiResponse.<T>builder()
                        .code(201)
                        .message("Created")
                        .result(data)
                        .build()
                );
    }
}