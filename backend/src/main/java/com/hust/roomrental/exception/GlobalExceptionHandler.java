package com.hust.roomrental.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorBody> handleApi(ApiException ex) {
        return ResponseEntity
                .status(ex.getStatus())
                .body(ErrorBody.of(ex.getStatus().value(), ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorBody> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a + "; " + b));
        return ResponseEntity.badRequest()
                .body(ErrorBody.of(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", fields));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorBody> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.badRequest()
                .body(ErrorBody.of(400, "VALIDATION_ERROR", ex.getMessage(), null));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorBody> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorBody.of(401, "BAD_CREDENTIALS", "Email hoặc mật khẩu không đúng", null));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorBody> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorBody.of(403, "FORBIDDEN", "Không có quyền thực hiện thao tác", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorBody> handleOther(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorBody.of(500, "INTERNAL_ERROR", "Lỗi hệ thống", null));
    }

    public record ErrorBody(
            Instant timestamp,
            int status,
            String code,
            String message,
            Map<String, String> fieldErrors
    ) {
        static ErrorBody of(int status, String code, String message, Map<String, String> fieldErrors) {
            return new ErrorBody(Instant.now(), status, code, message, fieldErrors);
        }

        static ErrorBody of(int status, String code, String message) {
            return of(status, code, message, null);
        }
    }
}
