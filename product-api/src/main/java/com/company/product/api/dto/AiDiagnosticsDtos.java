package com.company.product.api.dto;

import java.util.Map;

public class AiDiagnosticsDtos {

    public record AiConfigView(
            boolean aiEnabled,
            String llmTimeout,
            String gigachatBaseUrl,
            String gigachatAuthUrl,
            String gigachatModel,
            String gigachatScope,
            Boolean gigachatUnsafeSsl,
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

    public record ConnectivityCheckView(
            String url,
            String host,
            Integer port,
            boolean dnsOk,
            String[] resolvedIps,
            String dnsError,
            boolean tcpOk,
            Long tcpDurationMs,
            String tcpError,
            boolean tlsOk,
            Long tlsDurationMs,
            String tlsError,
            boolean httpOk,
            Long httpDurationMs,
            Integer httpStatus,
            String httpError
    ) {}

    public record ConnectivityView(
            ConnectivityCheckView auth,
            ConnectivityCheckView chat
    ) {}

    public record DiagnosticsView(
            AiConfigView config,
            Map<String, PingResultView> checks
    ) {}
}
