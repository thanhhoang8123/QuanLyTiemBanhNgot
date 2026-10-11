package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.OrderStatusHistory;
import com.nhom4.QuanLyTiemBanhNgot.service.OrderStatusHistoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderStatusHistoryController {

    private final OrderStatusHistoryService service;

    public OrderStatusHistoryController(OrderStatusHistoryService service) {
        this.service = service;
    }

    @GetMapping("/{orderId}/status-history")
    public List<OrderStatusHistory> getStatusHistory(@PathVariable Long orderId) {
        System.out.println("ORDER ID NHAN DUOC: " + orderId);

        List<OrderStatusHistory> result = service.findByOrderId(orderId);

        System.out.println("SO BAN GHI TIM THAY: " + result.size());

        return result;
    }
}