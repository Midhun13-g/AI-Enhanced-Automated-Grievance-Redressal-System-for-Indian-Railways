package com.railway.backend.repository;

import com.railway.backend.entity.ComplaintHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintHistoryRepository extends JpaRepository<ComplaintHistory, Long> {
    List<ComplaintHistory> findByComplaintId(Long complaintId);
}
