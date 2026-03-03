package com.railway.backend.controller;

import com.railway.backend.entity.User;
import com.railway.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

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
            item.put("trainNumber", u.getTrainNumber());
            item.put("createdAt", u.getCreatedAt());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepository.findByUsername(auth.getName()).map(u -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", u.getId());
            item.put("username", u.getUsername());
            item.put("role", u.getRole());
            item.put("station", u.getStation());
            item.put("trainNumber", u.getTrainNumber());
            item.put("fullName", u.getFullName());
            item.put("createdAt", u.getCreatedAt());
            return ResponseEntity.ok(item);
        }).orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PatchMapping("/me/train-number")
    public ResponseEntity<Map<String, Object>> updateTrainNumber(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepository.findByUsername(auth.getName()).map(user -> {
            String trainNumber = body.get("trainNumber");
            if (trainNumber != null) {
                trainNumber = trainNumber.trim();
                if (trainNumber.isBlank()) {
                    trainNumber = null;
                }
            }
            user.setTrainNumber(trainNumber);
            userRepository.save(user);
            Map<String, Object> res = new HashMap<>();
            res.put("message", "Train number updated");
            res.put("trainNumber", user.getTrainNumber());
            return ResponseEntity.ok(res);
        }).orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}
