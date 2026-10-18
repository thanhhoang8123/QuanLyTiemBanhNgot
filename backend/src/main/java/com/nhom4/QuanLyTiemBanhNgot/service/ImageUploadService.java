
package com.nhom4.QuanLyTiemBanhNgot.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class ImageUploadService {

    private static final Logger logger =
            LoggerFactory.getLogger(ImageUploadService.class);

    private final ObjectProvider<Cloudinary> cloudinaryProvider;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp");

    public ImageUploadService(ObjectProvider<Cloudinary> cloudinaryProvider) {
        this.cloudinaryProvider = cloudinaryProvider;
    }

    /**
     * Upload ảnh sản phẩm lên Cloudinary và trả về URL ảnh.
     */
    public String uploadProductImage(MultipartFile file) throws IOException {
        Cloudinary cloudinary = cloudinaryProvider.getIfAvailable();
        if (cloudinary == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ tải ảnh chưa được cấu hình. Vui lòng thiết lập "
                            + "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY "
                            + "và CLOUDINARY_API_SECRET.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ảnh");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "Kích thước ảnh không được vượt quá 5 MB");
        }

        String contentType = file.getContentType();

        if (contentType == null
                || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
        }

        Map<?, ?> result;
        try {
            result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "quan-ly-tiem-banh/products",
                            "resource_type", "image"));
        } catch (IOException | RuntimeException exception) {
            // Không log exception message vì lỗi từ SDK có thể chứa thông tin request.
            logger.warn(
                    "Cloudinary image upload failed ({})",
                    exception.getClass().getSimpleName());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Cloudinary không xử lý được ảnh. Kiểm tra cấu hình Cloudinary "
                            + "và kết nối mạng rồi thử lại.");
        }

        Object secureUrl = result.get("secure_url");

        if (!(secureUrl instanceof String url) || url.isBlank()) {
            throw new IOException("Cloudinary không trả về URL ảnh");
        }

        return url;
    }
}
