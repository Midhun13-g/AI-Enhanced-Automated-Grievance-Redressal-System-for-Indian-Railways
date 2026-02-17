package com.railway.backend.controller;

import com.railway.backend.dto.LoginRequest;
import com.railway.backend.dto.LoginResponse;
import com.railway.backend.entity.User;
import com.railway.backend.repository.UserRepository;
import com.railway.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setRole(user.getRole());
        return ResponseEntity.ok(response);
    }
}
