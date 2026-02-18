package com.railway.backend.controller;

import com.railway.backend.dto.FeedbackRequest;
import com.railway.backend.entity.Feedback;
import com.railway.backend.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
public class FeedbackController {
    private final FeedbackRepository feedbackRepository;

    @PostMapping
    public ResponseEntity<Feedback> submitFeedback(@RequestBody FeedbackRequest request) {
        Feedback feedback = Feedback.builder()
                .userEmail(request.getUserEmail())
                .message(request.getMessage())
                .type(request.getType())
                .date(LocalDate.now().toString())
                .build();
        return ResponseEntity.ok(feedbackRepository.save(feedback));
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        return ResponseEntity.ok(feedbackRepository.findAll());
    }
}
