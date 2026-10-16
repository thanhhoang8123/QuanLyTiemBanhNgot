package com.nhom4.QuanLyTiemBanhNgot.service;

import com.cloudinary.Cloudinary;
import com.nhom4.QuanLyTiemBanhNgot.config.CloudinaryConfig;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImageUploadServiceTest {

    @Test
    void cloudinaryBeanIsCreatedWhenAllPropertiesAreConfigured() {
        try (AnnotationConfigApplicationContext context =
                     new AnnotationConfigApplicationContext()) {
            context.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("test-cloudinary", Map.of(
                            "cloudinary.cloud-name", "test-cloud",
                            "cloudinary.api-key", "test-api-key",
                            "cloudinary.api-secret", "test-api-secret")));
            context.register(CloudinaryConfig.class);
            context.refresh();

            assertNotNull(context.getBean(Cloudinary.class));
        }
    }

    @Test
    void applicationStartsAndUploadReturnsServiceUnavailableWithoutCloudinaryConfig() {
        try (AnnotationConfigApplicationContext context =
                     new AnnotationConfigApplicationContext()) {
            context.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("test-cloudinary", Map.of(
                            "cloudinary.cloud-name", "",
                            "cloudinary.api-key", "",
                            "cloudinary.api-secret", "")));
            context.register(CloudinaryConfig.class, ImageUploadService.class);
            context.refresh();

            ImageUploadService service = context.getBean(ImageUploadService.class);
            assertNotNull(service);
            assertThrows(
                    org.springframework.beans.factory.NoSuchBeanDefinitionException.class,
                    () -> context.getBean(Cloudinary.class));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> service.uploadProductImage(null));

            assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
            assertEquals(
                    "Dịch vụ tải ảnh chưa được cấu hình. Vui lòng thiết lập "
                            + "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY "
                            + "và CLOUDINARY_API_SECRET.",
                    exception.getReason());
        }
    }
}
