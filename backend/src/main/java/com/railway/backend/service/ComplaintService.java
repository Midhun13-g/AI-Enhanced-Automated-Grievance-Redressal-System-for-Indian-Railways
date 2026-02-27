package com.railway.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {
    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository complaintHistoryRepository;
    private final UserRepository userRepository;
    private final KafkaTemplate<String, Long> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;
    @Value("${app.ai.enabled:true}")
    private boolean aiEnabled;
    @Value("${app.ai.classifier-url:https://midhun-2542-railwaymodel.hf.space/classify}")
    private String aiClassifierUrl;

    public List<ComplaintResponse> getAllComplaints(Authentication auth) {
        if (auth != null) {
            String username = auth.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            if (isPassenger(user)) {
                String passengerIdentity = resolvePassengerDisplayName(user);
                String legacyIdentity = resolvePassengerLegacyName(user);
                return Stream.concat(
                                complaintRepository.findByPassengerNameIgnoreCaseOrderByUrgencyScoreDesc(passengerIdentity).stream(),
                                complaintRepository.findByPassengerNameIgnoreCaseOrderByUrgencyScoreDesc(legacyIdentity).stream())
                        .collect(Collectors.toMap(Complaint::getId, c -> c, (left, right) -> left))
                        .values().stream()
                        .sorted((a, b) -> Integer.compare(
                                b.getUrgencyScore() != null ? b.getUrgencyScore() : 0,
                                a.getUrgencyScore() != null ? a.getUrgencyScore() : 0))
                        .map(this::toResponse)
                        .collect(Collectors.toList());
            }
        }
        return complaintRepository.findAllByOrderByUrgencyScoreDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ComplaintResponse> getMyComplaints(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return List.of();
        }

        String username = auth.getName();
        List<Complaint> mine = complaintRepository.findByCreatedByUsernameOrderByUrgencyScoreDesc(username);
        if (!mine.isEmpty()) {
            return mine.stream().map(this::toResponse).collect(Collectors.toList());
        }

        // Backward compatibility for legacy complaints created before ownership tracking.
        Optional<User> userOpt = userRepository.findByUsername(username);
        List<Complaint> legacy = new ArrayList<>(complaintRepository.findByPassengerNameIgnoreCaseOrderByUrgencyScoreDesc(username));
        if (userOpt.isPresent()) {
            String fullName = userOpt.get().getFullName();
            if (fullName != null && !fullName.isBlank() && !fullName.equalsIgnoreCase(username)) {
                legacy.addAll(complaintRepository.findByPassengerNameIgnoreCaseOrderByUrgencyScoreDesc(fullName));
            }
        }

        return legacy.stream()
                .collect(Collectors.toMap(Complaint::getId, c -> c, (a, b) -> a))
                .values().stream()
                .sorted((a, b) -> Integer.compare(
                        b.getUrgencyScore() == null ? 0 : b.getUrgencyScore(),
                        a.getUrgencyScore() == null ? 0 : a.getUrgencyScore()))
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
        if (station == null || station.isBlank()) {
            return complaintRepository.findAllByOrderByUrgencyScoreDesc().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return complaintRepository.findByStationContext(station.trim()).stream()
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
        User user = null;
        String station = null;
        String createdByUsername = null;
        String passengerName = request.getPassengerName();

        if (auth != null && auth.getName() != null) {
            createdByUsername = auth.getName();
            user = userRepository.findByUsername(createdByUsername).orElse(null);
            station = user != null ? normalizeName(user.getStation()) : null;
            if (isPassenger(user)) {
                passengerName = resolvePassengerDisplayName(user);
            }
        }
        if (passengerName == null || passengerName.isBlank()) {
            passengerName = user != null ? resolvePassengerDisplayName(user) : "User";
        }

        Complaint complaint = Complaint.builder()
                .passengerName(passengerName)
                .passengerPhone(normalizePhone(request.getPassengerPhone()))
                .createdByUsername(createdByUsername)
                .complaintText(request.getComplaintText())
                .trainNumber(request.getTrainNumber())
                .incidentAt(request.getIncidentAt())
                .category(category)
                .status("PENDING")
                .urgencyScore(0)
                .station(station)
                .previousStation(normalizeName(request.getPreviousStation()))
                .nextStation(normalizeName(request.getNextStation()))
                .aiMetadata(null)
                .build();

        enrichWithAi(complaint);
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
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();

        complaint.setStatus(request.getNewStatus());
        if ("RESOLVED".equalsIgnoreCase(request.getNewStatus())) {
            complaint.setResolvedBy(resolveUserDisplayName(user));
            complaint.setResolvedByRole(user.getRole());
        } else {
            complaint.setResolvedBy(null);
            complaint.setResolvedByRole(null);
        }

        Complaint updated = complaintRepository.save(complaint);
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
        String department = complaint.getDepartment();
        if (department == null || department.isBlank() || "GENERAL".equalsIgnoreCase(department) || "General".equalsIgnoreCase(department)) {
            department = inferDepartmentFromText(complaint.getComplaintText());
        }

        resp.setId(complaint.getId());
        resp.setPassengerName(complaint.getPassengerName());
        resp.setPassengerPhone(complaint.getPassengerPhone());
        resp.setComplaintText(complaint.getComplaintText());
        resp.setCategory(department != null ? department : complaint.getCategory());
        resp.setUrgencyScore(complaint.getUrgencyScore());
        resp.setStatus(complaint.getStatus());
        resp.setStation(complaint.getStation());
        resp.setPreviousStation(complaint.getPreviousStation());
        resp.setNextStation(complaint.getNextStation());
        resp.setDepartment(department);
        resp.setTrainNumber(complaint.getTrainNumber());
        resp.setIncidentAt(complaint.getIncidentAt());
        resp.setAssignedTo(complaint.getAssignedTo());
        resp.setRemarks(complaint.getRemarks());
        resp.setResolvedBy(complaint.getResolvedBy());
        resp.setResolvedByRole(complaint.getResolvedByRole());
        resp.setAiMetadata(complaint.getAiMetadata());
        resp.setCreatedAt(complaint.getCreatedAt());
        resp.setUpdatedAt(complaint.getUpdatedAt());
        return resp;
    }

    private void enrichWithAi(Complaint complaint) {
        if (!aiEnabled || complaint.getComplaintText() == null || complaint.getComplaintText().isBlank()) {
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = Map.of("text", complaint.getComplaintText());
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            String responseBody = restTemplate.postForObject(URI.create(aiClassifierUrl), request, String.class);
            if (responseBody == null || responseBody.isBlank()) {
                return;
            }

            Map<String, Object> payload = objectMapper.readValue(responseBody, new TypeReference<Map<String, Object>>() {
            });
            String department = extractDepartment(payload);
            String priority = extractPriority(payload);
            Integer urgencyScore = mapPriorityToUrgency(priority);

            if (department != null && !department.isBlank()) {
                complaint.setDepartment(department);
                complaint.setCategory(department);
            }
            complaint.setUrgencyScore(urgencyScore);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("classifierUrl", aiClassifierUrl);
            metadata.put("raw", payload);
            metadata.put("department", department);
            metadata.put("priority", priority);
            metadata.put("urgencyScore", urgencyScore);
            complaint.setAiMetadata(objectMapper.writeValueAsString(metadata));
        } catch (RestClientException ex) {
            log.warn("AI service unavailable for complaint classification. Continuing without enrichment.", ex);
        } catch (Exception ex) {
            log.warn("AI enrichment failed due to unexpected response format. Continuing without enrichment.", ex);
        }

        if (complaint.getDepartment() == null || complaint.getDepartment().isBlank()
                || "GENERAL".equalsIgnoreCase(complaint.getDepartment())
                || "General".equalsIgnoreCase(complaint.getDepartment())) {
            String inferredDepartment = inferDepartmentFromText(complaint.getComplaintText());
            complaint.setDepartment(inferredDepartment);
            complaint.setCategory(inferredDepartment);
            if (complaint.getUrgencyScore() == null || complaint.getUrgencyScore() <= 0) {
                complaint.setUrgencyScore(mapPriorityToUrgency(inferPriorityFromDepartment(inferredDepartment)));
            }
        }
    }

    private String extractDepartment(Map<String, Object> payload) {
        Object department = payload.get("department");
        if (department instanceof String value && !value.isBlank()) {
            return value.trim();
        }

        Object category = payload.get("category");
        if (category == null) {
            return null;
        }

        String label = category.toString().trim();
        try {
            int idx = Integer.parseInt(label);
            return mapCategoryIndexToDepartment(idx);
        } catch (NumberFormatException ignored) {
            return label.isBlank() ? null : label;
        }
    }

    private String extractPriority(Map<String, Object> payload) {
        Object priority = payload.get("priority");
        if (priority instanceof String value && !value.isBlank()) {
            return value.trim().toLowerCase();
        }
        return null;
    }

    private Integer mapPriorityToUrgency(String priority) {
        if ("high".equals(priority)) {
            return 95;
        }
        if ("medium".equals(priority)) {
            return 70;
        }
        return 35;
    }

    private String inferPriorityFromDepartment(String department) {
        if (department == null) {
            return "low";
        }
        return switch (department) {
            case "Medical", "Security" -> "high";
            case "Electrical", "Coach", "Maintenance", "Water" -> "medium";
            default -> "low";
        };
    }

    private String inferDepartmentFromText(String text) {
        if (text == null || text.isBlank()) {
            return "General";
        }
        String normalized = text.toLowerCase();

        if (containsAny(normalized, "security", "theft", "steal", "snatch", "rob", "fight", "harass", "unsafe", "police", "rpf", "sos")) {
            return "Security";
        }
        if (containsAny(normalized, "medical", "doctor", "ambulance", "heart attack", "injury", "blood", "faint", "poison")) {
            return "Medical";
        }
        if (containsAny(normalized, "water", "no water", "drinking", "tap", "toilet water")) {
            return "Water";
        }
        if (containsAny(normalized, "clean", "dirty", "toilet", "restroom", "sanitation", "garbage", "smell")) {
            return "Cleanliness";
        }
        if (containsAny(normalized, "food", "catering", "meal", "vendor")) {
            return "Catering";
        }
        if (containsAny(normalized, "light", "fan", "charging", "socket", "electric", "power")) {
            return "Electrical";
        }
        if (containsAny(normalized, "coach", "berth", "seat", "window", "door", "ac")) {
            return "Coach";
        }
        if (containsAny(normalized, "ticket", "refund", "pnr", "reservation", "booking")) {
            return "Ticketing";
        }
        if (containsAny(normalized, "repair", "maintenance", "broken", "damage", "leak")) {
            return "Maintenance";
        }
        return "General";
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String mapCategoryIndexToDepartment(int index) {
        return switch (index) {
            case 0 -> "Catering";
            case 1 -> "Cleanliness";
            case 2 -> "Coach";
            case 3 -> "Electrical";
            case 4 -> "General";
            case 5 -> "Maintenance";
            case 6 -> "Medical";
            case 7 -> "Security";
            case 8 -> "Ticketing";
            case 9 -> "Water";
            default -> "General";
        };
    }

    private boolean isPassenger(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        String role = user.getRole().trim().toUpperCase(Locale.ROOT);
        return "USER".equals(role) || "PASSENGER".equals(role);
    }

    private String resolvePassengerDisplayName(User user) {
        if (user == null) {
            return "User";
        }
        String fullName = normalizeName(user.getFullName());
        if (fullName != null) {
            return fullName;
        }
        String username = user.getUsername();
        if (username == null || username.isBlank()) {
            return "User";
        }
        return username.split("@")[0].trim();
    }

    private String resolvePassengerLegacyName(User user) {
        if (user == null || user.getUsername() == null || user.getUsername().isBlank()) {
            return resolvePassengerDisplayName(user);
        }
        String localPart = user.getUsername().split("@")[0].trim();
        return Objects.equals(localPart, resolvePassengerDisplayName(user))
                ? resolvePassengerDisplayName(user)
                : localPart;
    }

    private String normalizeName(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replaceAll("\\s+", " ");
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizePhone(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replaceAll("\\s+", "");
        return normalized.isBlank() ? null : normalized;
    }

    private String resolveUserDisplayName(User user) {
        if (user == null) {
            return "System";
        }
        String fullName = normalizeName(user.getFullName());
        if (fullName != null) {
            return fullName;
        }
        String username = normalizeName(user.getUsername());
        return username != null ? username : "System";
    }
}
