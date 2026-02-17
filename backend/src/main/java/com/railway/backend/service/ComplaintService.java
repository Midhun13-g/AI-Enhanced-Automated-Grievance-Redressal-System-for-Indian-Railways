package com.railway.backend.service;

import com.railway.backend.dto.ComplaintRequest;
import com.railway.backend.dto.ComplaintResponse;
import com.railway.backend.dto.StatusUpdateRequest;
import com.railway.backend.entity.Complaint;
import com.railway.backend.entity.ComplaintHistory;
import com.railway.backend.entity.User;
import com.railway.backend.repository.ComplaintHistoryRepository;
import com.railway.backend.repository.ComplaintRepository;
import com.railway.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {
    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository complaintHistoryRepository;
    private final UserRepository userRepository;
    private final KafkaTemplate<String, Long> kafkaTemplate;

    public List<ComplaintResponse> getAllComplaints() {
        return complaintRepository.findAllByOrderByUrgencyScoreDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ComplaintResponse createComplaint(ComplaintRequest request) {
        Complaint complaint = Complaint.builder()
                .passengerName(request.getPassengerName())
                .complaintText(request.getComplaintText())
                .category(request.getCategory())
                .status("PENDING")
                .urgencyScore(0)
                .aiMetadata(null)
                .build();
        Complaint saved = complaintRepository.save(complaint);
        kafkaTemplate.send("complaint-classification", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public ComplaintResponse updateStatus(Long id, StatusUpdateRequest request, Authentication auth) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        String oldStatus = complaint.getStatus();
        complaint.setStatus(request.getNewStatus());
        Complaint updated = complaintRepository.save(complaint);
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        ComplaintHistory history = ComplaintHistory.builder()
                .complaint(complaint)
                .oldStatus(oldStatus)
                .newStatus(request.getNewStatus())
                .updatedBy(user)
                .build();
        complaintHistoryRepository.save(history);
        return toResponse(updated);
    }

    private ComplaintResponse toResponse(Complaint complaint) {
        ComplaintResponse resp = new ComplaintResponse();
        resp.setId(complaint.getId());
        resp.setPassengerName(complaint.getPassengerName());
        resp.setComplaintText(complaint.getComplaintText());
        resp.setCategory(complaint.getCategory());
        resp.setUrgencyScore(complaint.getUrgencyScore());
        resp.setStatus(complaint.getStatus());
        resp.setAiMetadata(complaint.getAiMetadata());
        resp.setCreatedAt(complaint.getCreatedAt());
        resp.setUpdatedAt(complaint.getUpdatedAt());
        return resp;
    }
}
