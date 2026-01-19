package org.rent.room.be.exception;


import org.rent.room.be.base.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
//import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

//import java.nio.file.AccessDeniedException;
import java.util.HashMap;
import java.util.Map;


@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<?>> handleRuntimeException(AppException e) {

        ErrorCode errorCode = e.getErrorCode();
        ApiResponse<?> apiResponse = new ApiResponse<>();

        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity
                .status(errorCode.getHttpStatusCode())
                .body(apiResponse);

    }

//    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
//    public ResponseEntity<ApiResponse<?>> handleAccessDenied() {
//        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
//
//        return ResponseEntity
//                .status(errorCode.getHttpStatusCode())
//                .body(ApiResponse.builder()
//                        .code(errorCode.getCode())
//                        .message(errorCode.getMessage())
//                        .build());
//    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(MethodArgumentNotValidException
                                                                                           ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage())
        );

        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                HttpStatus.BAD_REQUEST.value(),
                "Data validation failed",
                errors
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }


//    @ExceptionHandler(ValidationErrorsException.class)
//    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(ValidationErrorsException ex) {
//        ApiResponse<Map<String, String>> apiResponse = new ApiResponse<>();
//
//        apiResponse.setCode(HttpStatus.BAD_REQUEST.value());
//        apiResponse.setMessage("Data is not invalid!");
//        apiResponse.setResult(ex.getErrors());
//
//        return ResponseEntity
//                .status(HttpStatus.BAD_REQUEST)
//                .body(apiResponse);
//    }
}