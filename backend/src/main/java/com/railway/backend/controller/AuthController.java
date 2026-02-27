package com.railway.backend.controller;

import com.railway.backend.dto.LoginRequest;
import com.railway.backend.dto.LoginResponse;
import com.railway.backend.dto.SignupRequest;
import com.railway.backend.entity.User;
import com.railway.backend.repository.UserRepository;
import com.railway.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Value("${app.officer-signup-key:RAILMADAD_OFFICER_2026}")
    private String officerSignupKey;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        String fullName = normalizeFullName(request.getFullName());
        String email = normalizeEmail(request.getEmail());
        String role = request.getRole() != null ? request.getRole().trim().toUpperCase() : "USER";
        if (fullName == null || fullName.length() < 2) {
            return badRequest("Please enter your full name.");
        }
        if (!isValidEmail(email)) {
            return badRequest("Please enter a valid email address.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return badRequest("Password must be at least 6 characters");
        }
        if ("SUPER_ADMIN".equals(role)) {
            return badRequest("Super Admin cannot be created from public signup");
        }
        List<String> allowedRoles = List.of("USER", "PASSENGER", "STATION_MASTER", "STATION_STAFF", "RPF_ADMIN");
        if (!allowedRoles.contains(role)) {
            return badRequest("Invalid role selected");
        }
        if (!"USER".equals(role) && !"PASSENGER".equals(role)) {
            if (request.getOfficerKey() == null || !officerSignupKey.equals(request.getOfficerKey().trim())) {
                return badRequest("Invalid officer access key");
            }
        }

        Optional<User> existingUser = userRepository.findByUsername(email);
        if (existingUser.isPresent()) {
            return badRequest("Email is already registered");
        }

        User user = User.builder()
                .username(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .fullName(fullName)
                .station(request.getStationName())
                .build();

        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("email", savedUser.getUsername());
        response.put("fullName", savedUser.getFullName());
        response.put("role", savedUser.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (!isValidEmail(email)) {
            return badRequest("Please enter a valid email address.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        User user = userRepository.findByUsername(email).orElseThrow();
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setRole(user.getRole());
        response.setEmail(user.getUsername());
        response.setFullName(resolveDisplayName(user));
        response.setStationName(user.getStation());
        return ResponseEntity.ok(response);
    }

    private boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private String normalizeFullName(String fullName) {
        if (fullName == null) {
            return null;
        }
        return fullName.trim().replaceAll("\\s+", " ");
    }

    private String resolveDisplayName(User user) {
        String fullName = normalizeFullName(user.getFullName());
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        String username = user.getUsername();
        if (username == null || username.isBlank()) {
            return "User";
        }
        String localPart = username.split("@")[0].replace('.', ' ').replace('_', ' ');
        String[] words = localPart.trim().split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(word.charAt(0)));
            if (word.length() > 1) {
                builder.append(word.substring(1));
            }
        }
        return builder.length() > 0 ? builder.toString() : "User";
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
