package com.railway.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HelplineController {
    @GetMapping("/helpline")
    public Map<String, String> getHelpline() {
        return Map.of(
                "number", "139",
                "description", "For Security/Medical Assistance");
    }
}
