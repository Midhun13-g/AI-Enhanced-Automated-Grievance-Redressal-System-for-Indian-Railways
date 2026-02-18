package com.railway.backend.controller;

import com.railway.backend.dto.SuggestionRequest;
import com.railway.backend.entity.Suggestion;
import com.railway.backend.repository.SuggestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/suggestion")
@RequiredArgsConstructor
public class SuggestionController {
    private final SuggestionRepository suggestionRepository;

    @PostMapping
    public ResponseEntity<Suggestion> submitSuggestion(@RequestBody SuggestionRequest request) {
        Suggestion suggestion = Suggestion.builder()
                .userEmail(request.getUserEmail())
                .message(request.getMessage())
                .date(LocalDate.now().toString())
                .build();
        return ResponseEntity.ok(suggestionRepository.save(suggestion));
    }

    @GetMapping
    public ResponseEntity<List<Suggestion>> getAllSuggestions() {
        return ResponseEntity.ok(suggestionRepository.findAll());
    }
}
