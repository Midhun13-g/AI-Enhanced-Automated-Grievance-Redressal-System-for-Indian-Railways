package com.railway.backend.controller;

import com.railway.backend.entity.Complaint;
import com.railway.backend.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/track")
@RequiredArgsConstructor
public class TrackController {
    private final ComplaintRepository complaintRepository;

    @GetMapping("/{refNo}")
    public ResponseEntity<?> trackComplaint(@PathVariable Long refNo) {
        Optional<Complaint> complaint = complaintRepository.findById(refNo);
        return complaint.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
