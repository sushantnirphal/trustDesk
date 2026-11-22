package com.trustdesk.eval;

import com.trustdesk.entity.EvalCase;
import com.trustdesk.exception.ResourceNotFoundException;
import com.trustdesk.repository.EvalCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EvalServiceImpl implements EvalService {

    private final EvalCaseRepository evalCaseRepository;
    private final EvaluationService evaluationService;

    @Override
    @Transactional(readOnly = true)
    public List<EvalCase> getCases() {
        return evalCaseRepository.findAllByOrderByCaseIdAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public EvalCase getCase(String caseId) {
        return evalCaseRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Eval case not found: " + caseId));
    }

    @Override
    public EvalRunResponse run(EvalRunRequest request) {
        return evaluationService.run(request);
    }
}
