package com.trustdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TrustDeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrustDeskApplication.class, args);
    }
}
