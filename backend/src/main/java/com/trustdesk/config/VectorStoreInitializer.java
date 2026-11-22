package com.trustdesk.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

/**
 * Enables the pgvector extension and optimises the embedding column on PostgreSQL.
 * On other databases (e.g. H2 for tests) this is a no-op and retrieval falls
 * back to keyword search automatically.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class VectorStoreInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        String product;
        try (Connection connection = dataSource.getConnection()) {
            product = connection.getMetaData().getDatabaseProductName();
        } catch (Exception ex) {
            log.warn("Could not detect database: {}", ex.getMessage());
            return;
        }

        if (product == null || !product.toLowerCase().contains("postgres")) {
            log.info("pgvector init skipped (database={}). Vector search will fall back to keyword.", product);
            return;
        }

        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
            log.info("pgvector extension is enabled");
        } catch (Exception ex) {
            log.warn("Could not enable pgvector extension: {}", ex.getMessage());
            return;
        }

        // Best-effort: convert the TEXT embedding column to vector(1536) and index it.
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE documents ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector");
            log.info("Converted documents.embedding to vector(1536)");
        } catch (Exception ex) {
            log.debug("embedding column conversion skipped: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_documents_embedding "
                            + "ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)");
            log.info("Ensured ivfflat index on documents.embedding");
        } catch (Exception ex) {
            log.debug("ivfflat index creation skipped: {}", ex.getMessage());
        }
    }
}
