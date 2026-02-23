package com.railway.backend.controller;

import com.railway.backend.entity.User;
import com.railway.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String station) {
        List<User> users;
        if (role != null && !role.isBlank() && station != null && !station.isBlank()) {
            users = userRepository.findByRoleAndStation(role.toUpperCase(), station);
        } else if (role != null && !role.isBlank()) {
            users = userRepository.findByRole(role.toUpperCase());
        } else if (station != null && !station.isBlank()) {
            users = userRepository.findByStation(station);
        } else {
            users = userRepository.findAll();
        }

        List<Map<String, Object>> response = users.stream().map(u -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", u.getId());
            item.put("username", u.getUsername());
            item.put("role", u.getRole());
            item.put("station", u.getStation());
            item.put("createdAt", u.getCreatedAt());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
