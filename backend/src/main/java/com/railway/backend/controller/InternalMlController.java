package com.railway.backend.controller;

import com.railway.backend.dto.ComplaintClassificationUpdateRequest;
import com.railway.backend.dto.InternalComplaintDto;
import com.railway.backend.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/internal/ml")
@RequiredArgsConstructor
public class InternalMlController {
    private final ComplaintService complaintService;

    @Value("${app.internal.api-key:railway-internal-key}")
    private String internalApiKey;

    @GetMapping("/complaints/{id}")
    public ResponseEntity<InternalComplaintDto> getComplaintForClassification(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Key", required = false) String providedKey) {
        validateInternalKey(providedKey);
        return ResponseEntity.ok(complaintService.getComplaintForMl(id));
    }

    @PatchMapping("/complaints/{id}/classification")
    public ResponseEntity<Void> updateClassification(
            @PathVariable Long id,
            @RequestBody ComplaintClassificationUpdateRequest request,
            @RequestHeader(value = "X-Internal-Key", required = false) String providedKey) {
        validateInternalKey(providedKey);
        complaintService.applyClassificationResult(id, request);
        return ResponseEntity.noContent().build();
    }

    private void validateInternalKey(String providedKey) {
        if (providedKey == null || !providedKey.equals(internalApiKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal key");
        }
    }
}
