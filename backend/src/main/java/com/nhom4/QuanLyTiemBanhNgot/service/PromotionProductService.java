package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.promotionproduct.PromotionProductResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Product;
import com.nhom4.QuanLyTiemBanhNgot.entity.Promotion;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProduct;
import com.nhom4.QuanLyTiemBanhNgot.entity.PromotionProductId;
import com.nhom4.QuanLyTiemBanhNgot.exception.BadRequestException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ConflictException;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.mapper.PromotionProductMapper;
import com.nhom4.QuanLyTiemBanhNgot.repository.ProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionProductRepository;
import com.nhom4.QuanLyTiemBanhNgot.repository.PromotionRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service xử lý liên kết giữa khuyến mãi và sản phẩm.
 */
@Service
public class PromotionProductService {

    private final PromotionProductRepository promotionProductRepository;
    private final PromotionRepository promotionRepository;
    private final ProductRepository productRepository;
    private final PromotionProductMapper promotionProductMapper;

    public PromotionProductService(
            PromotionProductRepository promotionProductRepository,
            PromotionRepository promotionRepository,
            ProductRepository productRepository,
            PromotionProductMapper promotionProductMapper) {
        this.promotionProductRepository = promotionProductRepository;
        this.promotionRepository = promotionRepository;
        this.productRepository = productRepository;
        this.promotionProductMapper = promotionProductMapper;
    }

    @Transactional(readOnly = true)
    public List<PromotionProductResponse> findAll() {
        return promotionProductRepository.findAll().stream()
                .map(promotionProductMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PromotionProductResponse findByIds(Long promotionId, Long productId) {
        validateIds(promotionId, productId);
        PromotionProductId id = new PromotionProductId(promotionId, productId);
        PromotionProduct promotionProduct = promotionProductRepository.findById(id)
                .orElseThrow(() -> notFound(promotionId, productId));
        return promotionProductMapper.toResponse(promotionProduct);
    }

    @Transactional
    public PromotionProductResponse create(PromotionProductRequest request) {
        if (request == null) {
            throw new BadRequestException("Thông tin liên kết khuyến mãi-sản phẩm là bắt buộc");
        }
        validateIds(request.promotionId(), request.productId());

        Promotion promotion = promotionRepository.findById(request.promotionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khuyến mãi với ID: " + request.promotionId()
                ));
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy sản phẩm với ID: " + request.productId()
                ));

        PromotionProductId id = new PromotionProductId(
                request.promotionId(),
                request.productId()
        );
        if (promotionProductRepository.existsById(id)) {
            throw duplicateLink();
        }

        PromotionProduct link = new PromotionProduct();
        link.setId(id);
        link.setPromotion(promotion);
        link.setProduct(product);
        try {
            return promotionProductMapper.toResponse(
                    promotionProductRepository.saveAndFlush(link)
            );
        } catch (DataIntegrityViolationException exception) {
            // Khóa chính ghép cũng bảo vệ trường hợp hai request tạo cùng liên kết đồng thời.
            throw duplicateLink();
        }
    }

    @Transactional
    public void deleteByIds(Long promotionId, Long productId) {
        validateIds(promotionId, productId);
        PromotionProductId id = new PromotionProductId(promotionId, productId);
        PromotionProduct link = promotionProductRepository.findById(id)
                .orElseThrow(() -> notFound(promotionId, productId));
        promotionProductRepository.delete(link);
    }

    private void validateIds(Long promotionId, Long productId) {
        if (promotionId == null || promotionId <= 0
                || productId == null || productId <= 0) {
            throw new BadRequestException(
                    "Mã khuyến mãi và mã sản phẩm phải là số dương"
            );
        }
    }

    private ResourceNotFoundException notFound(Long promotionId, Long productId) {
        return new ResourceNotFoundException(
                "Không tìm thấy liên kết khuyến mãi-sản phẩm ("
                        + promotionId + ", " + productId + ")"
        );
    }

    private ConflictException duplicateLink() {
        return new ConflictException(
                "Liên kết khuyến mãi-sản phẩm này đã tồn tại"
        );
    }
}
