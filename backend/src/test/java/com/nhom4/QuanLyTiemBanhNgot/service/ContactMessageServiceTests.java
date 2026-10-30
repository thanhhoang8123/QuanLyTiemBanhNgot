package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.shop.ContactRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessage;
import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessageStatus;
import com.nhom4.QuanLyTiemBanhNgot.exception.ResourceNotFoundException;
import com.nhom4.QuanLyTiemBanhNgot.repository.ContactMessageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ContactMessageServiceTests {
    @Test
    void createStoresContactMessageWithNewStatus() {
        ContactMessageRepository repository = mock(ContactMessageRepository.class);
        when(repository.save(any(ContactMessage.class))).thenAnswer(invocation -> {
            ContactMessage message = invocation.getArgument(0);
            message.setId(5L);
            message.setCreatedAt(java.time.LocalDateTime.of(2026, 10, 29, 12, 0));
            return message;
        });
        ContactMessageService service = new ContactMessageService(repository);

        var response = service.create(new ContactRequest(
                "  Nguyễn An ",
                " an@example.com ",
                " Hỏi về bánh ",
                " Tôi muốn hỏi thông tin. "));

        var captor = org.mockito.ArgumentCaptor.forClass(ContactMessage.class);
        verify(repository).save(captor.capture());
        ContactMessage saved = captor.getValue();
        assertEquals("Nguyễn An", saved.getName());
        assertEquals("an@example.com", saved.getEmail());
        assertEquals("Hỏi về bánh", saved.getSubject());
        assertEquals("Tôi muốn hỏi thông tin.", saved.getMessage());
        assertEquals(ContactMessageStatus.NEW, saved.getStatus());
        assertEquals(5L, response.id());
    }

    @Test
    void findPageFiltersAndSortsNewestFirst() {
        ContactMessageRepository repository = mock(ContactMessageRepository.class);
        when(repository.findPage(
                ContactMessageStatus.NEW,
                "an",
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")
                        .and(Sort.by(Sort.Direction.DESC, "id")))))
                .thenReturn(new PageImpl<>(List.of()));
        ContactMessageService service = new ContactMessageService(repository);

        service.findPage(0, 10, " an ", ContactMessageStatus.NEW);

        verify(repository).findPage(
                ContactMessageStatus.NEW,
                "an",
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")
                        .and(Sort.by(Sort.Direction.DESC, "id"))));
    }

    @Test
    void updateStatusChangesMessageAndMissingMessageReturnsNotFound() {
        ContactMessageRepository repository = mock(ContactMessageRepository.class);
        ContactMessage message = new ContactMessage();
        message.setId(7L);
        message.setName("An");
        message.setEmail("an@example.com");
        message.setSubject("Hỏi");
        message.setMessage("Nội dung");
        when(repository.findById(7L)).thenReturn(Optional.of(message));
        when(repository.findById(8L)).thenReturn(Optional.empty());
        ContactMessageService service = new ContactMessageService(repository);

        var response = service.updateStatus(7L, ContactMessageStatus.RESOLVED);

        assertEquals(ContactMessageStatus.RESOLVED, response.status());
        assertThrows(ResourceNotFoundException.class,
                () -> service.updateStatus(8L, ContactMessageStatus.RESOLVED));
    }

    @Test
    void createWithCustomerLinksCustomerAndFillsInformation() {
        ContactMessageRepository repository = mock(ContactMessageRepository.class);
        when(repository.save(any(ContactMessage.class))).thenAnswer(invocation -> {
            ContactMessage message = invocation.getArgument(0);
            message.setId(9L);
            message.setCreatedAt(java.time.LocalDateTime.of(2026, 10, 30, 10, 0));
            return message;
        });
        ContactMessageService service = new ContactMessageService(repository);

        com.nhom4.QuanLyTiemBanhNgot.entity.Customer customer = new com.nhom4.QuanLyTiemBanhNgot.entity.Customer();
        customer.setId(12L);
        customer.setFullName("Trần Bảo");
        customer.setEmail("bao@example.com");
        customer.setPhone("0912345678");

        var response = service.create(new ContactRequest(
                "Tên cũ",
                "emailcu@example.com",
                "Tư vấn bánh cưới",
                "Tôi cần bánh 3 tầng."), customer);

        assertEquals(9L, response.id());
        assertEquals(12L, response.customerId());
        assertEquals("Trần Bảo", response.name());
        assertEquals("bao@example.com", response.email());
        assertEquals("0912345678", response.phone());
        assertEquals("Tư vấn bánh cưới", response.subject());
    }
}
