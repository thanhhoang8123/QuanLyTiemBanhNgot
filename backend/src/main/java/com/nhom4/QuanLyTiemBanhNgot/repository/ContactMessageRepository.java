package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessage;
import com.nhom4.QuanLyTiemBanhNgot.entity.ContactMessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    @Query("""
            select contactMessage from ContactMessage contactMessage
            where (:status is null or contactMessage.status = :status)
              and (:keyword is null
                   or lower(contactMessage.name) like lower(concat('%', :keyword, '%'))
                   or lower(contactMessage.email) like lower(concat('%', :keyword, '%'))
                   or lower(contactMessage.subject) like lower(concat('%', :keyword, '%'))
                   or lower(contactMessage.message) like lower(concat('%', :keyword, '%')))
            """)
    Page<ContactMessage> findPage(
            @Param("status") ContactMessageStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    List<ContactMessage> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
