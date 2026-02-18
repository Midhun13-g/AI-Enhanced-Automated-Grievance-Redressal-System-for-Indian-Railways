package com.railway.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
public class EmergencyContactController {
    @GetMapping("/emergency-contacts")
    public List<Map<String, String>> getContacts() {
        return List.of(
                Map.of("type", "Security/Medical Assistance", "number", "139"),
                Map.of("type", "Fire", "number", "101"),
                Map.of("type", "Police", "number", "100"));
    }
}
