package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.PageResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.shop.ContactMessageResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.shop.ContactMessageStatusRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessageStatus;
import com.nhom4.QuanLyTiemBanhNgot.service.ContactMessageService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact-messages")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
public class ContactMessageController {
    private final ContactMessageService contactMessageService;

    public ContactMessageController(ContactMessageService contactMessageService) {
        this.contactMessageService = contactMessageService;
    }

    @GetMapping("/page")
    public PageResponse<ContactMessageResponse> getMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ContactMessageStatus status) {
        Page<ContactMessageResponse> result = contactMessageService.findPage(page, size, keyword, status);
        return PageResponse.from(result);
    }

    @PutMapping("/{id}/status")
    public ContactMessageResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ContactMessageStatusRequest request) {
        return contactMessageService.updateStatus(id, request.status());
    }
}
