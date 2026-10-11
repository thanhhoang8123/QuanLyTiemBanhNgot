package com.nhom4.QuanLyTiemBanhNgot.exception;

import jakarta.validation.Validation;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void mapsNotFoundTo404() {
        var response = handler.handleResourceNotFound(
                new ResourceNotFoundException("Không tìm thấy đơn hàng")
        );

        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        assertEquals("Không tìm thấy đơn hàng", response.getBody().message());
        assertNotNull(response.getBody().timestamp());
    }

    @Test
    void mapsBadRequestTo400() {
        var response = handler.handleBadRequest(new BadRequestException("Dữ liệu sai"));

        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatusCode().value());
        assertEquals("Dữ liệu sai", response.getBody().message());
    }

    @Test
    void mapsBeanValidationErrorTo400WithReadableMessage() {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError(
                "request",
                "quantity",
                0,
                false,
                null,
                null,
                "Số lượng phải lớn hơn 0"
        ));
        MethodArgumentNotValidException exception =
                new MethodArgumentNotValidException(null, bindingResult);

        var response = handler.handleValidationException(exception);

        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatusCode().value());
        assertEquals("Số lượng phải lớn hơn 0", response.getBody().message());
    }

    @Test
    void mapsConstraintViolationTo400() {
        var validator = Validation.buildDefaultValidatorFactory().getValidator();
        Set<jakarta.validation.ConstraintViolation<InvalidRequest>> violations =
                validator.validate(new InvalidRequest(""));
        var exception = new jakarta.validation.ConstraintViolationException(violations);

        var response = handler.handleValidationException(exception);

        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatusCode().value());
        assertEquals("Tên không được để trống", response.getBody().message());
    }

    @Test
    void mapsConflictTo409() {
        var response = handler.handleConflict(new ConflictException("Không thể xử lý"));

        assertEquals(HttpStatus.CONFLICT.value(), response.getStatusCode().value());
        assertEquals("Không thể xử lý", response.getBody().message());
    }

    @Test
    void preservesStatusFromExistingResponseStatusException() {
        var response = handler.handleResponseStatusException(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy")
        );

        assertEquals(HttpStatus.NOT_FOUND.value(), response.getStatusCode().value());
        assertEquals("Không tìm thấy", response.getBody().message());
    }

    @Test
    void hidesDatabaseDetailsFromConflictResponse() {
        var response = handler.handleDataIntegrityViolation(
                new DataIntegrityViolationException("duplicate key: sensitive SQL")
        );

        assertEquals(HttpStatus.CONFLICT.value(), response.getStatusCode().value());
        assertEquals("Dữ liệu bị trùng hoặc vi phạm ràng buộc", response.getBody().message());
        assertFalse(response.getBody().message().contains("sensitive SQL"));
    }

    @Test
    void hidesUnexpectedExceptionDetailsFromInternalErrorResponse() {
        var response = handler.handleUnexpectedException(
                new IllegalStateException("internal stack detail")
        );

        assertEquals(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                response.getStatusCode().value()
        );
        assertEquals(
                "Đã xảy ra lỗi nội bộ. Vui lòng thử lại sau",
                response.getBody().message()
        );
        assertFalse(response.getBody().message().contains("internal stack detail"));
    }

    private record InvalidRequest(@NotBlank(message = "Tên không được để trống") String name) {
    }
}
