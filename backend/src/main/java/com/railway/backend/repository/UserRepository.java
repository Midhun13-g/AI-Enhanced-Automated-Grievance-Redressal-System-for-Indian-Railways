package com.railway.backend.repository;

import com.railway.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    List<User> findByRole(String role);

    List<User> findByStation(String station);

    List<User> findByRoleAndStation(String role, String station);

    boolean existsByStaffId(String staffId);
}
