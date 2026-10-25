package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Employee;
import com.nhom4.QuanLyTiemBanhNgot.dto.employee.EmployeeOptionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    @Query("""
            select new com.nhom4.QuanLyTiemBanhNgot.dto.employee.EmployeeOptionResponse(
                employee.id,
                employee.fullName,
                case when account.username = :username then true else false end,
                employee.status)
            from Employee employee
            left join employee.account account
            where employee.status = true
            """)
    List<EmployeeOptionResponse> findActiveOptions(@Param("username") String username);

    Optional<Employee> findByAccount_UsernameAndStatusTrue(String username);
}