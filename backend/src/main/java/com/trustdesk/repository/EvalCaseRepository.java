package com.trustdesk.repository;

import com.trustdesk.entity.EvalCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EvalCaseRepository extends JpaRepository<EvalCase, Long> {
    Optional<EvalCase> findByCaseId(String caseId);
    List<EvalCase> findByCaseIdIn(Collection<String> caseIds);
    List<EvalCase> findAllByOrderByCaseIdAsc();
}
