package com.company.product.api.controller;

import com.company.product.api.ai.AiDiagnosticsService;
import com.company.product.api.dto.AiDiagnosticsDtos;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/ai/diagnostics")
@PreAuthorize("hasRole('ADMIN')")
public class AiDiagnosticsController {

    private final AiDiagnosticsService diagnosticsService;

    public AiDiagnosticsController(AiDiagnosticsService diagnosticsService) {
        this.diagnosticsService = diagnosticsService;
    }

    @GetMapping
    public AiDiagnosticsDtos.DiagnosticsView diagnostics() {
        return diagnosticsService.diagnostics();
    }
}

