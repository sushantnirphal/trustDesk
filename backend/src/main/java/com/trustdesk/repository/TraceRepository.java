package com.trustdesk.repository;

import com.trustdesk.entity.Trace;
import com.trustdesk.enums.RunType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TraceRepository extends JpaRepository<Trace, Long> {
    List<Trace> findByTicketId(Long ticketId);
    List<Trace> findByRunType(RunType runType);
    List<Trace> findByTicketIdOrderByTimestampDesc(Long ticketId);
    List<Trace> findByRunTypeOrderByTimestampDesc(RunType runType);
    List<Trace> findAllByOrderByTimestampDesc();
}
