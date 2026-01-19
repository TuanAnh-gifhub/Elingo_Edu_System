package org.rent.room.be.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    //User
    USER_EXISTED(6001,"Email existed", HttpStatus.BAD_REQUEST),
    // Page Errors
    INVALID_PAGINATION(7001,"Invalid pagination parameters",HttpStatus.BAD_REQUEST);

    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}
