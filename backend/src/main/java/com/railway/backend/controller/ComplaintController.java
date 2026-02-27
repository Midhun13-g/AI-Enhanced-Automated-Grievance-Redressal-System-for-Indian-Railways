package com.railway.backend.controller;

import com.railway.backend.dto.ComplaintRequest;
import com.railway.backend.dto.ComplaintResponse;
import com.railway.backend.dto.RemarkUpdateRequest;
import com.railway.backend.dto.StatusUpdateRequest;
import com.railway.backend.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
public class ComplaintController {
    private final ComplaintService complaintService;

    // For admin: get all complaints
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(Authentication authentication) {
        return ResponseEntity.ok(complaintService.getAllComplaints(authentication));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(Authentication authentication) {
        return ResponseEntity.ok(complaintService.getMyComplaints(authentication));
    }

    // For station master: get complaints by station
    @GetMapping("/station/{station}")
    public ResponseEntity<List<ComplaintResponse>> getComplaintsByStation(@PathVariable String station) {
        return ResponseEntity.ok(complaintService.getComplaintsByStation(station));
    }

    // For admin: get complaints by department
    @GetMapping("/department/{department}")
    public ResponseEntity<List<ComplaintResponse>> getComplaintsByDepartment(@PathVariable String department) {
        return ResponseEntity.ok(complaintService.getComplaintsByDepartment(department));
    }

    // For station staff: get complaints assigned to them
    @GetMapping("/assigned-to/{staffName}")
    public ResponseEntity<List<ComplaintResponse>> getByAssignedTo(@PathVariable String staffName) {
        return ResponseEntity.ok(complaintService.getComplaintsByAssignedTo(staffName));
    }

    // For station master: assign complaint to staff
    @PatchMapping("/{id}/assign")
    public ResponseEntity<ComplaintResponse> assignComplaint(
            @PathVariable Long id,
            @RequestParam String staffName,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(complaintService.assignComplaint(id, staffName, remarks));
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(@Valid @RequestBody ComplaintRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(complaintService.createComplaint(request, authentication));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(@PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(complaintService.updateStatus(id, request, authentication));
    }

    @PatchMapping("/{id}/remarks")
    public ResponseEntity<ComplaintResponse> updateRemarks(@PathVariable Long id,
            @Valid @RequestBody RemarkUpdateRequest request) {
        return ResponseEntity.ok(complaintService.updateRemarks(id, request.getRemarks()));
    }
}
