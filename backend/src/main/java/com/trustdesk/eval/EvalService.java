package com.trustdesk.eval;

import com.trustdesk.entity.EvalCase;

import java.util.List;

public interface EvalService {

    List<EvalCase> getCases();

    EvalCase getCase(String caseId);

    EvalRunResponse run(EvalRunRequest request);
}
