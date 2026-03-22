package com.company.product.api.config;

import com.company.product.api.service.BusinessException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Value("${app.debug.errors:false}")
    private boolean debugErrors;

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusiness(BusinessException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Ошибка валидации", "errors", errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Недостаточно прав"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnknown(Exception ex, HttpServletRequest request) {
        String errorId = UUID.randomUUID().toString().substring(0, 8);
        log.error("Unhandled exception errorId={} path={}", errorId, request == null ? "n/a" : request.getRequestURI(), ex);

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Внутренняя ошибка сервера");
        body.put("errorId", errorId);

        String debugHeader = request == null ? null : request.getHeader("X-Debug");
        boolean wantDebug = debugHeader != null && (debugHeader.equals("1") || debugHeader.equalsIgnoreCase("true"));
        if (debugErrors && wantDebug) {
            String msg = ex.getMessage() == null ? "" : ex.getMessage().replace("\n", " ").replace("\r", " ").trim();
            if (msg.length() > 240) msg = msg.substring(0, 240);
            body.put("exception", ex.getClass().getName());
            body.put("detail", msg);
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
