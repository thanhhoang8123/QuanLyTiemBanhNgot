package com.nhom4.QuanLyTiemBanhNgot.controller;

import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<Employee> getAll() {
        return employeeService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getById(@PathVariable Long id) {
        return employeeService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Employee create(@RequestBody Employee employee) {
        return employeeService.save(employee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> update(
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

                    return ResponseEntity.ok(
                            employeeService.save(existingEmployee)
                    );
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
}