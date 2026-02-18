package com.railway.backend.controller;

import com.railway.backend.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/departments/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final ComplaintRepository complaintRepository;

    @GetMapping("/by-department")
    public Map<String, Long> getComplaintsByDepartment() {
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : complaintRepository.countComplaintsByDepartment()) {
            result.put((String) row[0], (Long) row[1]);
        }
        return result;
    }

    @GetMapping("/top-issues")
    public List<String> getTopIssues() {
        return complaintRepository.findTopComplaintIssues().stream()
                .map(row -> (String) row[0])
                .toList();
    }
}
