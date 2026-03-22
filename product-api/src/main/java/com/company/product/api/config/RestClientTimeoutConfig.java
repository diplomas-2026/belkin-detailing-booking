package com.company.product.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class RestClientTimeoutConfig {

    @Bean
    public RestClientCustomizer restClientTimeoutCustomizer(
            @Value("${spring.ai.gigachat.internal.connect-timeout:PT10S}") Duration connectTimeout,
            @Value("${spring.ai.gigachat.internal.read-timeout:PT30S}") Duration readTimeout) {
        return builder -> {
            Duration ct = connectTimeout == null ? Duration.ofSeconds(10) : connectTimeout;
            if (ct.isNegative() || ct.isZero()) {
                ct = Duration.ofSeconds(10);
            }

            HttpClient httpClient = HttpClient.newBuilder()
                    .connectTimeout(ct)
                    .build();

            JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
            if (readTimeout != null && !readTimeout.isNegative() && !readTimeout.isZero()) {
                rf.setReadTimeout(readTimeout);
            }

            builder.requestFactory(rf);
        };
    }
}

