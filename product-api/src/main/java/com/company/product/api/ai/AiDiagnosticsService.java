package com.company.product.api.ai;

import com.company.product.api.dto.AiDiagnosticsDtos;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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

    private static final Logger log = LoggerFactory.getLogger(AiDiagnosticsService.class);

    private static final String DEFAULT_CHAT_BASE_URL = "https://gigachat.devices.sberbank.ru/api/v1/";
    private static final String DEFAULT_AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";

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

    public AiDiagnosticsDtos.ConnectivityView connectivity() {
        String chatBaseUrl = firstNonBlank(
                env.getProperty("spring.ai.gigachat.base-url"),
                env.getProperty("spring.ai.gigachat.baseUrl"),
                DEFAULT_CHAT_BASE_URL
        );
        String authUrl = firstNonBlank(
                env.getProperty("spring.ai.gigachat.auth.bearer.url"),
                env.getProperty("spring.ai.gigachat.auth.bearerUrl"),
                DEFAULT_AUTH_URL
        );

        AiDiagnosticsDtos.ConnectivityCheckView authCheck = checkUrl(authUrl, Duration.ofSeconds(3), Duration.ofSeconds(5));
        AiDiagnosticsDtos.ConnectivityCheckView chatCheck = checkUrl(chatBaseUrl, Duration.ofSeconds(3), Duration.ofSeconds(5));
        return new AiDiagnosticsDtos.ConnectivityView(authCheck, chatCheck);
    }

    private AiDiagnosticsDtos.AiConfigView buildConfig() {
        String apiKey = env.getProperty("spring.ai.gigachat.auth.bearer.api-key");
        boolean present = apiKey != null && !apiKey.isBlank();
        Integer len = present ? apiKey.length() : null;
        String fp = present ? fingerprint(apiKey) : null;

        Duration llmTimeout = properties.llmTimeout();
        Duration ct = parseDuration(env.getProperty("spring.ai.gigachat.internal.connect-timeout"));
        Duration rt = parseDuration(env.getProperty("spring.ai.gigachat.internal.read-timeout"));
        String baseUrl = firstNonBlank(
                env.getProperty("spring.ai.gigachat.base-url"),
                env.getProperty("spring.ai.gigachat.baseUrl"),
                DEFAULT_CHAT_BASE_URL
        );
        String authUrl = firstNonBlank(
                env.getProperty("spring.ai.gigachat.auth.bearer.url"),
                env.getProperty("spring.ai.gigachat.auth.bearerUrl"),
                DEFAULT_AUTH_URL
        );
        String model = env.getProperty("spring.ai.gigachat.chat.options.model");
        String scope = env.getProperty("spring.ai.gigachat.auth.scope");
        Boolean unsafeSsl = parseBoolean(env.getProperty("spring.ai.gigachat.auth.bearer.unsafe-ssl"));

        return new AiDiagnosticsDtos.AiConfigView(
                properties.enabled(),
                llmTimeout == null ? null : llmTimeout.toString(),
                baseUrl,
                authUrl,
                model,
                scope,
                unsafeSsl,
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
            log.warn("LLM ping timeout after {}ms (timeout={})", dur, timeout);
            return new AiDiagnosticsDtos.PingResultView(false, dur, null, "Таймаут LLM (" + timeout + ")");
        } catch (Exception e) {
            long dur = System.currentTimeMillis() - started;
            log.warn("LLM ping error after {}ms: {}", dur, e.toString());
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

    private static Boolean parseBoolean(String v) {
        if (v == null || v.isBlank()) return null;
        String t = v.trim().toLowerCase();
        if (t.equals("true") || t.equals("1") || t.equals("yes") || t.equals("y") || t.equals("on")) return true;
        if (t.equals("false") || t.equals("0") || t.equals("no") || t.equals("n") || t.equals("off")) return false;
        return null;
    }

    private static String safeMsg(String msg) {
        if (msg == null) return "";
        String m = msg.replace("\n", " ").replace("\r", " ").trim();
        if (m.length() > 220) m = m.substring(0, 220);
        return m;
    }

    private static String firstNonBlank(String a, String b, String c) {
        if (a != null && !a.isBlank()) return a.trim();
        if (b != null && !b.isBlank()) return b.trim();
        return c == null ? null : c.trim();
    }

    private static AiDiagnosticsDtos.ConnectivityCheckView checkUrl(String url, Duration tcpTimeout, Duration httpTimeout) {
        String host = null;
        Integer port = null;
        URI uri = null;
        try {
            uri = URI.create(url);
            host = uri.getHost();
            int p = uri.getPort();
            if (p <= 0) {
                p = "http".equalsIgnoreCase(uri.getScheme()) ? 80 : 443;
            }
            port = p;
        } catch (Exception e) {
            return new AiDiagnosticsDtos.ConnectivityCheckView(
                    url, null, null,
                    false, null, "Некорректный URL: " + e.getClass().getSimpleName(),
                    false, null, null,
                    false, null, null,
                    false, null, null, null
            );
        }

        boolean dnsOk = false;
        String[] ips = null;
        String dnsErr = null;
        try {
            InetAddress[] addrs = InetAddress.getAllByName(host);
            ips = new String[addrs.length];
            for (int i = 0; i < addrs.length; i++) {
                ips[i] = addrs[i].getHostAddress();
            }
            dnsOk = true;
        } catch (Exception e) {
            dnsErr = e.getClass().getSimpleName() + ": " + safeMsg(e.getMessage());
        }

        boolean tcpOk = false;
        Long tcpMs = null;
        String tcpErr = null;
        if (dnsOk) {
            long started = System.currentTimeMillis();
            try (Socket socket = new Socket()) {
                int timeoutMs = (int) Math.max(1000, tcpTimeout.toMillis());
                socket.connect(new InetSocketAddress(host, port), timeoutMs);
                tcpOk = true;
            } catch (Exception e) {
                tcpErr = e.getClass().getSimpleName() + ": " + safeMsg(e.getMessage());
            } finally {
                tcpMs = System.currentTimeMillis() - started;
            }
        }

        boolean tlsOk = false;
        Long tlsMs = null;
        String tlsErr = null;
        if (tcpOk && uri != null && "https".equalsIgnoreCase(uri.getScheme())) {
            long started = System.currentTimeMillis();
            try {
                SSLSocketFactory sf = (SSLSocketFactory) SSLSocketFactory.getDefault();
                try (SSLSocket sslSocket = (SSLSocket) sf.createSocket()) {
                    int timeoutMs = (int) Math.max(1000, tcpTimeout.toMillis());
                    sslSocket.connect(new InetSocketAddress(host, port), timeoutMs);
                    sslSocket.setSoTimeout((int) Math.max(1000, httpTimeout.toMillis()));
                    sslSocket.startHandshake();
                    tlsOk = true;
                }
            } catch (Exception e) {
                tlsErr = e.getClass().getSimpleName() + ": " + safeMsg(e.getMessage());
            } finally {
                tlsMs = System.currentTimeMillis() - started;
            }
        }

        boolean httpOk = false;
        Long httpMs = null;
        Integer status = null;
        String httpErr = null;
        if (tcpOk && uri != null) {
            long started = System.currentTimeMillis();
            try {
                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(tcpTimeout)
                        .followRedirects(HttpClient.Redirect.NORMAL)
                        .build();
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(uri)
                        .timeout(httpTimeout)
                        .GET()
                        .build();
                HttpResponse<Void> resp = client.send(req, HttpResponse.BodyHandlers.discarding());
                status = resp.statusCode();
                httpOk = true;
            } catch (Exception e) {
                httpErr = e.getClass().getSimpleName() + ": " + safeMsg(e.getMessage());
            } finally {
                httpMs = System.currentTimeMillis() - started;
            }
        }

        return new AiDiagnosticsDtos.ConnectivityCheckView(
                url, host, port,
                dnsOk, ips, dnsErr,
                tcpOk, tcpMs, tcpErr,
                tlsOk, tlsMs, tlsErr,
                httpOk, httpMs, status, httpErr
        );
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
