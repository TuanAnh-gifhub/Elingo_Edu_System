package org.rent.room.be.exception;

import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.base.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<?>> handleRuntimeException(AppException e) {

        ErrorCode errorCode = e.getErrorCode();

        return ResponseEntity
                .status(errorCode.getHttpStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage())
        );

        return ResponseEntity.badRequest().body(
                ApiResponse.<Map<String, String>>builder()
                        .code(ErrorCode.INVALID_KEY.getCode())
                        .message("Validation failed")
                        .result(errors)
                        .build()
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(AccessDeniedException e) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

        return ResponseEntity
                .status(errorCode.getHttpStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<?>> handleJsonError(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(
                ApiResponse.builder()
                        .code(ErrorCode.INVALID_KEY.getCode())
                        .message("Malformed JSON request")
                        .build()
        );
    }

        @ExceptionHandler(MaxUploadSizeExceededException.class)
        public ResponseEntity<ApiResponse<?>> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException e) {
                int payloadTooLarge = 413;
                return ResponseEntity.status(HttpStatusCode.valueOf(payloadTooLarge)).body(
                                ApiResponse.builder()
                                .code(payloadTooLarge)
                                                .message("File qua lon. Vui long upload tep nho hon 50MB.")
                                                .build()
                );
        }

    // 6. CATCH-ALL: Bắt tất cả các lỗi còn lại (RuntimeException, NullPointer, DB Error...)
    // Đây là chốt chặn cuối cùng để API không bao giờ chết hoặc trả về stacktrace xấu xí
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleUnwantedException(Exception e) {
        // Ghi log lỗi ra console server để Developer sửa
        log.error("Uncaught Exception: ", e);

        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;

        return ResponseEntity
                .status(errorCode.getHttpStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException(AuthenticationException e) {
        ErrorCode errorCode = ErrorCode.UNAUTHENTICATED; // Enum 1001

        return ResponseEntity
                .status(errorCode.getHttpStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(ValidationErrorsException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(ValidationErrorsException ex) {
        ApiResponse<Map<String, String>> apiResponse = new ApiResponse<>();

        apiResponse.setCode(HttpStatus.BAD_REQUEST.value());
        apiResponse.setMessage("Data is not invalid!");
        apiResponse.setResult(ex.getErrors());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(apiResponse);
    }
}