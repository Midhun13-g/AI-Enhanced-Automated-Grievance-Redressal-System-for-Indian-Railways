package com.railway.backend.controller;

import com.railway.backend.entity.User;
import com.railway.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // List all users (role summary)
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("userCode", toUserCode(u.getId()));
            m.put("username", u.getUsername());
            m.put("role", u.getRole());
            m.put("station", u.getStation());
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // Create a user with any role (station master, staff, RPF admin etc.)
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String role = body.get("role");
        String stationName = body.get("stationName");

        if (email == null || email.isBlank() || password == null || password.length() < 6 || role == null) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "email, password (min 6 chars), and role are required");
            return ResponseEntity.badRequest().body(err);
        }
        if (userRepository.findByUsername(email.toLowerCase()).isPresent()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Email already exists");
            return ResponseEntity.badRequest().body(err);
        }

        User user = User.builder()
                .username(email.toLowerCase())
                .password(passwordEncoder.encode(password))
                .role(role.toUpperCase())
                .station(stationName)
                .build();
        User saved = userRepository.save(user);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "User created successfully");
        res.put("id", saved.getId());
        res.put("userCode", toUserCode(saved.getId()));
        res.put("username", saved.getUsername());
        res.put("role", saved.getRole());
        res.put("station", saved.getStation());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    // Update a user's role or station
    @PatchMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            if (body.containsKey("role"))
                user.setRole(body.get("role").toUpperCase());
            if (body.containsKey("stationName"))
                user.setStation(body.get("stationName"));
            userRepository.save(user);
            Map<String, Object> res = new HashMap<>();
            res.put("message", "User updated");
            res.put("id", user.getId());
            res.put("userCode", toUserCode(user.getId()));
            res.put("username", user.getUsername());
            res.put("role", user.getRole());
            res.put("station", user.getStation());
            return ResponseEntity.ok(res);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete a user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id))
            return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        Map<String, String> res = new HashMap<>();
        res.put("message", "User deleted");
        return ResponseEntity.ok(res);
    }

    // System overview stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<User> all = userRepository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", all.size());
        stats.put("stationMasters", all.stream().filter(u -> "STATION_MASTER".equals(u.getRole())).count());
        stats.put("stationStaff", all.stream().filter(u -> "STATION_STAFF".equals(u.getRole())).count());
        stats.put("rpfAdmins", all.stream().filter(u -> "RPF_ADMIN".equals(u.getRole())).count());
        stats.put("passengers",
                all.stream().filter(u -> "USER".equals(u.getRole()) || "PASSENGER".equals(u.getRole())).count());
        return ResponseEntity.ok(stats);
    }

    private String toUserCode(Long id) {
        if (id == null) {
            return null;
        }
        return String.format("USR-%06d", id);
    }
}
