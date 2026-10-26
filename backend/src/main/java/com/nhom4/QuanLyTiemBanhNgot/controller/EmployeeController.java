package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.dto.employee.EmployeeOptionResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.employee.EmployeeListResponse;
import com.nhom4.QuanLyTiemBanhNgot.dto.PageResponse;
import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@PreAuthorize("hasRole('ADMIN')")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/options")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<EmployeeOptionResponse> getOptions(Authentication authentication) {
        return employeeService.getActiveOptions(authentication.getName());
    }

    @GetMapping
    public List<EmployeeListResponse> getAll() {
        return employeeService.getAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/page")
    public PageResponse<EmployeeListResponse> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "fullName") String sort,
            @RequestParam(defaultValue = "ASC") String direction) {
        return PageResponse.from(employeeService.getPage(page, size, keyword, sort, direction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeListResponse> getById(@PathVariable Long id) {
        return employeeService.getById(id)
                .map(employee -> ResponseEntity.ok(toResponse(employee)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public EmployeeListResponse create(@RequestBody Employee employee) {
        return toResponse(employeeService.save(employee));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeListResponse> update(
            @PathVariable Long id,
            @RequestBody Employee employee) {

        return employeeService.getById(id)
                .map(existingEmployee -> {
                    existingEmployee.setAccount(employee.getAccount());
                    existingEmployee.setFullName(employee.getFullName());
                    existingEmployee.setPhone(employee.getPhone());
                    existingEmployee.setEmail(employee.getEmail());
                    existingEmployee.setSalary(employee.getSalary());
                    existingEmployee.setStatus(employee.getStatus());

                    return ResponseEntity.ok(toResponse(employeeService.save(existingEmployee)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (employeeService.getById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private EmployeeListResponse toResponse(Employee employee) {
        return new EmployeeListResponse(
                employee.getId(),
                employee.getFullName(),
                employee.getPhone(),
                employee.getEmail(),
                employee.getSalary(),
                employee.getStatus());
    }
}