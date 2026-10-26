
package com.nhom4.QuanLyTiemBanhNgot.repository;

import com.nhom4.QuanLyTiemBanhNgot.entity.Account;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    @EntityGraph(attributePaths = "role")
    Optional<Account> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByCustomer_Id(Long customerId);

    @EntityGraph(attributePaths = "role")
    Optional<Account> findByEmailIgnoreCase(String email);

    Optional<Account> findByEmailVerificationTokenHash(String tokenHash);

    boolean existsByUsernameAndIdNot(String username, Long id);
}
