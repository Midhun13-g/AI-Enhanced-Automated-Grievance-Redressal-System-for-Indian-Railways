package com.railway.backend.controller;

import com.railway.backend.dto.AnnouncementRequest;
import com.railway.backend.dto.AnnouncementResponse;
import com.railway.backend.entity.Announcement;
import com.railway.backend.entity.User;
import com.railway.backend.repository.AnnouncementRepository;
import com.railway.backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody AnnouncementRequest request, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null || !"STATION_MASTER".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only station master can send announcements");
        }

        Announcement saved = announcementRepository.save(Announcement.builder()
                .station(normalize(request.getStation()))
                .team(normalize(request.getTeam()))
                .message(request.getMessage().trim())
                .createdBy(resolveDisplayName(user))
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @GetMapping("/station/{station}")
    public ResponseEntity<List<AnnouncementResponse>> listByStation(@PathVariable String station) {
        return ResponseEntity.ok(
                announcementRepository.findByStationOrderByCreatedAtDesc(normalize(station)).stream()
                        .map(this::toResponse)
                        .toList());
    }

    private AnnouncementResponse toResponse(Announcement a) {
        AnnouncementResponse r = new AnnouncementResponse();
        r.setId(a.getId());
        r.setStation(a.getStation());
        r.setTeam(a.getTeam());
        r.setMessage(a.getMessage());
        r.setCreatedBy(a.getCreatedBy());
        r.setCreatedAt(a.getCreatedAt());
        return r;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

    private String resolveDisplayName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName().trim();
        }
        return user.getUsername();
    }
}
