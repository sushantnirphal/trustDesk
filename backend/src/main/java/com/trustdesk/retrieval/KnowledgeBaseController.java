package com.trustdesk.retrieval;

import com.trustdesk.entity.Document;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/kb")
@RequiredArgsConstructor
public class KnowledgeBaseController {

    private final KnowledgeBaseService knowledgeBaseService;

    @PostMapping("/search")
    public ResponseEntity<KnowledgeBaseSearchResponse> search(
            @RequestBody KnowledgeBaseSearchRequest request) {
        return ResponseEntity.ok(knowledgeBaseService.search(request));
    }

    @GetMapping("/{kbId}")
    public ResponseEntity<Document> getDocument(@PathVariable String kbId) {
        return knowledgeBaseService.getDocumentByKbId(kbId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Document>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(knowledgeBaseService.getDocumentsByCategory(category));
    }
}
