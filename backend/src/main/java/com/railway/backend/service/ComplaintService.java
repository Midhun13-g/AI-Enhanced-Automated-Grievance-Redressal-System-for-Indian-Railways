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
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {
    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository complaintHistoryRepository;
    private final UserRepository userRepository;
    private final KafkaTemplate<String, Long> kafkaTemplate;
    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    public List<ComplaintResponse> getAllComplaints() {
        return complaintRepository.findAllByOrderByUrgencyScoreDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ComplaintResponse> getComplaintsByAssignedTo(String assignedTo) {
        return complaintRepository.findByAssignedTo(assignedTo).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ComplaintResponse assignComplaint(Long id, String staffName, String remarks) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        complaint.setAssignedTo(staffName);
        if (remarks != null && !remarks.isBlank())
            complaint.setRemarks(remarks);
        if ("PENDING".equals(complaint.getStatus()))
            complaint.setStatus("IN_PROGRESS");
        return toResponse(complaintRepository.save(complaint));
    }

    public List<ComplaintResponse> getComplaintsByStation(String station) {
        return complaintRepository.findByStation(station).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ComplaintResponse> getComplaintsByDepartment(String department) {
        return complaintRepository.findByDepartment(department).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ComplaintResponse createComplaint(ComplaintRequest request, Authentication auth) {
        String category = (request.getCategory() == null || request.getCategory().isBlank())
                ? "GENERAL"
                : request.getCategory().trim();
        String station = null;
        if (auth != null && auth.getName() != null) {
            station = userRepository.findByUsername(auth.getName())
                    .map(User::getStation)
                    .orElse(null);
        }
        Complaint complaint = Complaint.builder()
                .passengerName(request.getPassengerName())
                .complaintText(request.getComplaintText())
                .trainNumber(request.getTrainNumber())
                .incidentAt(request.getIncidentAt())
                .category(category)
                .status("PENDING")
                .urgencyScore(0)
                .station(station)
                .aiMetadata(null)
                .build();
        Complaint saved = complaintRepository.save(complaint);
        if (kafkaEnabled) {
            try {
                kafkaTemplate.send("complaint-classification", saved.getId());
            } catch (Exception ex) {
                log.warn("Kafka publish failed for complaint id {}. Complaint is saved; AI enrichment deferred.", saved.getId(), ex);
            }
        }
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

    @Transactional
    public ComplaintResponse updateRemarks(Long id, String remarks) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        complaint.setRemarks(remarks);
        return toResponse(complaintRepository.save(complaint));
    }

    private ComplaintResponse toResponse(Complaint complaint) {
        ComplaintResponse resp = new ComplaintResponse();
        resp.setId(complaint.getId());
        resp.setPassengerName(complaint.getPassengerName());
        resp.setComplaintText(complaint.getComplaintText());
        resp.setCategory(complaint.getCategory());
        resp.setUrgencyScore(complaint.getUrgencyScore());
        resp.setStatus(complaint.getStatus());
        resp.setStation(complaint.getStation());
        resp.setDepartment(complaint.getDepartment());
        resp.setTrainNumber(complaint.getTrainNumber());
        resp.setIncidentAt(complaint.getIncidentAt());
        resp.setAssignedTo(complaint.getAssignedTo());
        resp.setRemarks(complaint.getRemarks());
        resp.setAiMetadata(complaint.getAiMetadata());
        resp.setCreatedAt(complaint.getCreatedAt());
        resp.setUpdatedAt(complaint.getUpdatedAt());
        return resp;
    }
}
