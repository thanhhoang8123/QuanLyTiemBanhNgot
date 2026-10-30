package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.shop.ContactMessageResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.shop.ContactRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessage;
import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessageStatus;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.repository.ContactMessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ContactMessageService {
    private final ContactMessageRepository repository;

    public ContactMessageService(ContactMessageRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ContactMessageResponse create(ContactRequest request) {
        return create(request, null);
    }

    @Transactional
    public ContactMessageResponse create(ContactRequest request, Customer customer) {
        ContactMessage contactMessage = new ContactMessage();
        if (customer != null) {
            contactMessage.setCustomer(customer);
            contactMessage.setName(StringUtils.hasText(customer.getFullName()) ? customer.getFullName().trim() : request.name().trim());
            contactMessage.setEmail(StringUtils.hasText(customer.getEmail()) ? customer.getEmail().trim() : request.email().trim());
        } else {
            contactMessage.setName(request.name().trim());
            contactMessage.setEmail(request.email().trim());
        }
        contactMessage.setSubject(request.subject().trim());
        contactMessage.setMessage(request.message().trim());
        contactMessage.setStatus(ContactMessageStatus.NEW);

        ContactMessage saved = repository.save(contactMessage);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ContactMessageResponse> findByCustomer(Customer customer) {
        if (customer == null || customer.getId() == null) {
            return List.of();
        }
        return repository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ContactMessageResponse> findPage(
            int page,
            int size,
            String keyword,
            ContactMessageStatus status) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tham số phân trang không hợp lệ");
        }
        String normalizedKeyword = StringUtils.hasText(keyword) ? keyword.trim() : null;
        Page<ContactMessage> messages = repository.findPage(
                status,
                normalizedKeyword,
                PageRequest.of(
                        page,
                        size,
                        Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))));
        return messages.map(this::toResponse);
    }

    @Transactional
    public ContactMessageResponse updateStatus(Long id, ContactMessageStatus status) {
        ContactMessage contactMessage = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin nhắn liên hệ"));
        contactMessage.setStatus(status);
        return toResponse(contactMessage);
    }

    private ContactMessageResponse toResponse(ContactMessage contactMessage) {
        Long customerId = contactMessage.getCustomer() != null ? contactMessage.getCustomer().getId() : null;
        String phone = contactMessage.getCustomer() != null ? contactMessage.getCustomer().getPhone() : null;
        return new ContactMessageResponse(
                contactMessage.getId(),
                customerId,
                contactMessage.getName(),
                contactMessage.getEmail(),
                phone,
                contactMessage.getSubject(),
                contactMessage.getMessage(),
                contactMessage.getCreatedAt(),
                contactMessage.getStatus());
    }
}
