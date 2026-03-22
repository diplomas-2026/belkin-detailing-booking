package com.company.product.api.dto;

import java.util.Map;

public class AiDiagnosticsDtos {

    public record AiConfigView(
            boolean aiEnabled,
            String llmTimeout,
            String gigachatModel,
            String gigachatScope,
            String gigachatConnectTimeout,
            String gigachatReadTimeout,
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
