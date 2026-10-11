package com.nhom4.QuanLyTiemBanhNgot.exception;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String INVALID_REQUEST_MESSAGE = "Dữ liệu đầu vào không hợp lệ";
    private static final String CONFLICT_MESSAGE =
            "Dữ liệu bị trùng hoặc vi phạm ràng buộc";
    private static final String INTERNAL_ERROR_MESSAGE =
            "Đã xảy ra lỗi nội bộ. Vui lòng thử lại sau";

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException exception) {
        return error(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            HandlerMethodValidationException.class,
            ConstraintViolationException.class
    })
    ResponseEntity<ErrorResponse> handleValidationException(Exception exception) {
        if (exception instanceof MethodArgumentNotValidException validationException) {
            FieldError fieldError = validationException.getBindingResult()
                    .getFieldErrors()
                    .stream()
                    .findFirst()
                    .orElse(null);
            if (fieldError != null && fieldError.getDefaultMessage() != null) {
                return error(
                        HttpStatus.BAD_REQUEST,
                        fieldError.getDefaultMessage()
                );
            }
        }
        if (exception instanceof ConstraintViolationException validationException) {
            String validationMessage = validationException.getConstraintViolations()
                    .stream()
                    .map(violation -> violation.getMessage())
                    .findFirst()
                    .orElse(null);
            if (validationMessage != null) {
                return error(HttpStatus.BAD_REQUEST, validationMessage);
            }
        }
        return error(HttpStatus.BAD_REQUEST, INVALID_REQUEST_MESSAGE);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> handleUnreadableRequest(
            HttpMessageNotReadableException exception) {
        return error(HttpStatus.BAD_REQUEST, INVALID_REQUEST_MESSAGE);
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ErrorResponse> handleConflict(ConflictException exception) {
        return error(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException exception) {
        logger.warn("Request rejected by a database constraint", exception);
        return error(HttpStatus.CONFLICT, CONFLICT_MESSAGE);
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ErrorResponse> handleResponseStatusException(
            ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String message = exception.getReason() == null
                ? status.getReasonPhrase()
                : exception.getReason();
        return error(status, message);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpectedException(Exception exception) {
        logger.error("Unexpected error while processing request", exception);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, INTERNAL_ERROR_MESSAGE);
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(new ErrorResponse(status.value(), message, Instant.now()));
    }
}
