package com.company.product.api.ai;

import com.company.product.api.dto.AiDiagnosticsDtos;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class AiDiagnosticsService {

    private final AiProperties properties;
    private final Environment env;
    private final ExecutorService aiExecutor;
    private final ChatClient chatClient;

    public AiDiagnosticsService(AiProperties properties,
                                Environment env,
                                ExecutorService aiExecutor,
                                ObjectProvider<ChatClient.Builder> chatClientBuilderProvider) {
        this.properties = properties;
        this.env = env;
        this.aiExecutor = aiExecutor;
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        this.chatClient = builder == null ? null : builder.build();
    }

    public AiDiagnosticsDtos.DiagnosticsView diagnostics() {
        AiDiagnosticsDtos.AiConfigView config = buildConfig();
        Map<String, AiDiagnosticsDtos.PingResultView> checks = new LinkedHashMap<>();
        return new AiDiagnosticsDtos.DiagnosticsView(config, checks);
    }

    public AiDiagnosticsDtos.PingResultView ping() {
        return pingChat();
    }

    private AiDiagnosticsDtos.AiConfigView buildConfig() {
        String apiKey = env.getProperty("spring.ai.gigachat.auth.bearer.api-key");
        boolean present = apiKey != null && !apiKey.isBlank();
        Integer len = present ? apiKey.length() : null;
        String fp = present ? fingerprint(apiKey) : null;

        Duration llmTimeout = properties.llmTimeout();
        Duration ct = parseDuration(env.getProperty("spring.ai.gigachat.internal.connect-timeout"));
        Duration rt = parseDuration(env.getProperty("spring.ai.gigachat.internal.read-timeout"));
        String model = env.getProperty("spring.ai.gigachat.chat.options.model");
        String scope = env.getProperty("spring.ai.gigachat.auth.scope");

        return new AiDiagnosticsDtos.AiConfigView(
                properties.enabled(),
                llmTimeout == null ? null : llmTimeout.toString(),
                model,
                scope,
                ct == null ? null : ct.toString(),
                rt == null ? null : rt.toString(),
                present,
                len,
                fp
        );
    }

    private AiDiagnosticsDtos.PingResultView pingChat() {
        if (!properties.enabled()) {
            return new AiDiagnosticsDtos.PingResultView(false, 0, null, "AI отключен (app.ai.enabled=false)");
        }
        if (chatClient == null) {
            return new AiDiagnosticsDtos.PingResultView(false, 0, null, "ChatClient не сконфигурирован");
        }

        Duration timeout = properties.llmTimeout() == null ? Duration.ofSeconds(25) : properties.llmTimeout();
        long started = System.currentTimeMillis();
        try {
            CompletableFuture<String> fut = CompletableFuture.supplyAsync(() ->
                    chatClient.prompt()
                            .system("Ты тестовый ассистент. Ответь одним словом: ok")
                            .user("ping")
                            .call()
                            .content(), aiExecutor);

            String content = fut.get(Math.max(1, timeout.toSeconds()), TimeUnit.SECONDS);
            long dur = System.currentTimeMillis() - started;
            String trimmed = content == null ? null : content.trim();
            if (trimmed != null && trimmed.length() > 400) trimmed = trimmed.substring(0, 400);
            return new AiDiagnosticsDtos.PingResultView(true, dur, trimmed, null);
        } catch (java.util.concurrent.TimeoutException te) {
            long dur = System.currentTimeMillis() - started;
            return new AiDiagnosticsDtos.PingResultView(false, dur, null, "Таймаут LLM (" + timeout + ")");
        } catch (Exception e) {
            long dur = System.currentTimeMillis() - started;
            return new AiDiagnosticsDtos.PingResultView(false, dur, null, e.getClass().getSimpleName() + ": " + safeMsg(e.getMessage()));
        }
    }

    private static Duration parseDuration(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return Duration.parse(v.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static String safeMsg(String msg) {
        if (msg == null) return "";
        String m = msg.replace("\n", " ").replace("\r", " ").trim();
        if (m.length() > 220) m = m.substring(0, 220);
        return m;
    }

    private static String fingerprint(String apiKey) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(apiKey.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 6 && i < digest.length; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (Exception e) {
            return "n/a";
        }
    }
}
