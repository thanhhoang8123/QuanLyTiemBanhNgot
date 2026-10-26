package com.nhom4.QuanLyTiemBanhNgot.service;

import com.nhom4.QuanLyTiemBanhNgot.dto.employee.EmployeeOptionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.employee.EmployeeListResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public List<Employee> getAll() {
        return employeeRepository.findAll();
    }

    public Page<EmployeeListResponse> getPage(
            int page, int size, String keyword, String sort, String direction) {
        Pageable pageable = PaginationSupport.pageRequest(
                page, size, sort, direction, "fullName",
                Set.of("id", "fullName", "phone", "email", "salary", "status"));
        String value = keyword == null ? "" : keyword.trim();
        return employeeRepository
                .findByFullNameContainingIgnoreCaseOrPhoneContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        value, value, value, pageable)
                .map(employee -> new EmployeeListResponse(
                        employee.getId(),
                        employee.getFullName(),
                        employee.getPhone(),
                        employee.getEmail(),
                        employee.getSalary(),
                        employee.getStatus()));
    }

    public List<EmployeeOptionResponse> getActiveOptions(String username) {
        return employeeRepository.findActiveOptions(username);
    }

    public Optional<Employee> getById(Long id) {
        return employeeRepository.findById(id);
    }

    public Employee save(Employee employee) {
        return employeeRepository.save(employee);
    }

    public void delete(Long id) {
        employeeRepository.deleteById(id);
    }
}