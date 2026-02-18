package com.railway.backend.controller;

import com.railway.backend.dto.OtpRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/otp")
public class OtpController {
    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        // Simulate OTP sending
        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        // In production, store OTP and associate with mobile, send via SMS gateway
        return ResponseEntity.ok(Map.of("otp", otp, "message", "OTP sent successfully"));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        // Simulate OTP verification
        // In production, check OTP from DB/cache
        if (payload.get("otp") != null) {
            return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid OTP"));
    }
}
