package com.company.product.api.dto;

import java.time.Duration;
import java.util.Map;

public class AiDiagnosticsDtos {

    public record AiConfigView(
            boolean aiEnabled,
            Duration llmTimeout,
            String gigachatModel,
            String gigachatScope,
            Duration gigachatConnectTimeout,
            Duration gigachatReadTimeout,
            boolean apiKeyPresent,
            Integer apiKeyLength,
            String apiKeyFingerprint
    ) {}

    public record PingResultView(
            boolean ok,
            long durationMs,
            String content,
            String error
    ) {}

    public record DiagnosticsView(
            AiConfigView config,
            Map<String, PingResultView> checks
    ) {}
}

