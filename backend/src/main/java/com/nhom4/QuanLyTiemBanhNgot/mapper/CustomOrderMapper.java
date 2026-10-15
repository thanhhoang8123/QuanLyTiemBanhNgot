package com.nhom4.QuanLyTiemBanhNgot.mapper;

import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CreateCustomOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.CustomOrderResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.customorder.UpdateCustomOrderRequest;
import com.nhom4.QuanLyTiemBanhNgot.entity.Customer;
import com.nhom4.QuanLyTiemBanhNgot.entity.CustomOrder;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class CustomOrderMapper {

    public CustomOrder toEntity(
            CreateCustomOrderRequest request,
            Customer customer,
            Employee employee) {
        CustomOrder customOrder = new CustomOrder();
        customOrder.setCustomer(customer);
        customOrder.setEmployee(employee);
        copyRequestFields(request.cakeName(), request.requestDescription(),
                request.deliveryDate(), request.estimatedPrice(), request.deposit(),
                customOrder);
        return customOrder;
    }

    public void updateEntity(
            UpdateCustomOrderRequest request,
            Customer customer,
            Employee employee,
            CustomOrder customOrder) {
        customOrder.setCustomer(customer);
        customOrder.setEmployee(employee);
        copyRequestFields(request.cakeName(), request.requestDescription(),
                request.deliveryDate(), request.estimatedPrice(), request.deposit(),
                customOrder);
    }

    public CustomOrderResponse toResponse(CustomOrder customOrder) {
        return new CustomOrderResponse(
                customOrder.getId(),
                customOrder.getCustomer() == null ? null : customOrder.getCustomer().getId(),
                customOrder.getEmployee() == null ? null : customOrder.getEmployee().getId(),
                customOrder.getCakeName(),
                customOrder.getRequestDescription(),
                customOrder.getOrderDate(),
                customOrder.getDeliveryDate(),
                customOrder.getEstimatedPrice(),
                customOrder.getDeposit(),
                customOrder.getStatus()
        );
    }

    private void copyRequestFields(
            String cakeName,
            String requestDescription,
            LocalDateTime deliveryDate,
            BigDecimal estimatedPrice,
            BigDecimal deposit,
            CustomOrder customOrder) {
        customOrder.setCakeName(cakeName);
        customOrder.setRequestDescription(requestDescription);
        customOrder.setDeliveryDate(deliveryDate);
        customOrder.setEstimatedPrice(estimatedPrice);
        customOrder.setDeposit(deposit);
    }
}
