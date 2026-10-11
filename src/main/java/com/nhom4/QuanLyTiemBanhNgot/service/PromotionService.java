package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.CreatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.PromotionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotion.UpdatePromotionRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PromotionMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final PromotionMapper promotionMapper;

    public PromotionService(
            PromotionRepository promotionRepository,
            PromotionProductRepository promotionProductRepository,
            PromotionMapper promotionMapper) {
        this.promotionRepository = promotionRepository;
        this.promotionProductRepository = promotionProductRepository;
        this.promotionMapper = promotionMapper;
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> findAll() {
        return promotionRepository.findAll().stream()
                .map(promotionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }

        String trimmedKeyword = keyword.trim();
        return promotionRepository
                .findByPromotionCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
                        trimmedKeyword,
                        trimmedKeyword
                )
                .stream()
                .map(promotionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PromotionResponse findById(Long id) {
        return promotionMapper.toResponse(findEntityById(id));
    }

    @Transactional
    public PromotionResponse create(CreatePromotionRequest request) {
        if (request == null) {
            throw new BadRequestException("Thông tin khuyến mãi là bắt buộc");
        }
        validateRequest(
                request.promotionCode(),
                request.name(),
                request.discountPercent(),
                request.maxDiscount(),
                request.minOrderValue(),
                request.startDate(),
                request.endDate(),
                request.status()
        );
        String promotionCode = request.promotionCode().trim();
        if (promotionRepository.existsByPromotionCodeIgnoreCase(promotionCode)) {
            throw duplicateCode();
        }

        Promotion promotion = promotionMapper.toEntity(request);
        try {
            return promotionMapper.toResponse(
                    promotionRepository.saveAndFlush(promotion)
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException(
                    "Không thể lưu chương trình khuyến mãi do vi phạm ràng buộc dữ liệu"
            );
        }
    }

    @Transactional
    public PromotionResponse update(Long id, UpdatePromotionRequest request) {
        Promotion promotion = findEntityById(id);
        if (request == null) {
            throw new BadRequestException("Thông tin cập nhật khuyến mãi là bắt buộc");
        }
        validateRequest(
                request.promotionCode(),
                request.name(),
                request.discountPercent(),
                request.maxDiscount(),
                request.minOrderValue(),
                request.startDate(),
                request.endDate(),
                request.status()
        );
        String promotionCode = request.promotionCode().trim();
        if (promotionRepository.existsByPromotionCodeIgnoreCaseAndIdNot(
                promotionCode, id)) {
            throw duplicateCode();
        }

        promotionMapper.updateEntity(request, promotion);
        try {
            return promotionMapper.toResponse(
                    promotionRepository.saveAndFlush(promotion)
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException(
                    "Không thể cập nhật chương trình khuyến mãi do vi phạm ràng buộc dữ liệu"
            );
        }
    }

    @Transactional
    public void deleteById(Long id) {
        Promotion promotion = findEntityById(id);
        if (promotionProductRepository.existsByIdPromotionId(id)) {
            throw new ConflictException(
                    "Không thể xóa khuyến mãi đang liên kết với sản phẩm. "
                            + "Hãy gỡ các liên kết trong promotion_products trước."
            );
        }
        try {
            promotionRepository.delete(promotion);
            promotionRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException(
                    "Không thể xóa khuyến mãi do vẫn còn dữ liệu liên kết"
            );
        }
    }

    private Promotion findEntityById(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khuyến mãi với ID: " + id
                ));
    }

    private void validateRequest(
            String promotionCode,
            String name,
            BigDecimal discountPercent,
            BigDecimal maxDiscount,
            BigDecimal minOrderValue,
            LocalDate startDate,
            LocalDate endDate,
            Boolean status) {
        if (promotionCode == null || promotionCode.isBlank()
                || promotionCode.trim().length() > 30
                || name == null || name.isBlank() || name.trim().length() > 100
                || discountPercent == null
                || discountPercent.signum() <= 0
                || discountPercent.compareTo(new BigDecimal("100")) > 0
                || !fitsColumn(discountPercent, 3, 2)
                || (maxDiscount != null
                && (maxDiscount.signum() < 0 || !fitsColumn(maxDiscount, 13, 2)))
                || (minOrderValue != null
                && (minOrderValue.signum() < 0 || !fitsColumn(minOrderValue, 13, 2)))
                || startDate == null
                || endDate == null
                || status == null) {
            throw new BadRequestException("Thông tin khuyến mãi không hợp lệ");
        }
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException(
                    "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc"
            );
        }
    }

    private boolean fitsColumn(BigDecimal value, int integerDigits, int fractionDigits) {
        BigDecimal normalized = value.stripTrailingZeros();
        int actualFractionDigits = Math.max(normalized.scale(), 0);
        int actualIntegerDigits = Math.max(normalized.precision() - normalized.scale(), 0);
        return actualIntegerDigits <= integerDigits
                && actualFractionDigits <= fractionDigits;
    }

    private ConflictException duplicateCode() {
        return new ConflictException("Mã khuyến mãi đã tồn tại");
    }
}
