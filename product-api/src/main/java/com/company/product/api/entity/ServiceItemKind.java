package com.company.product.api.entity;

public enum ServiceItemKind {
    MANDATORY,
    OPTIONAL,
    CHOICE_OPTION;

    public static ServiceItemKind fromExternal(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("ServiceItemKind is null");
        }
        String normalized = raw.trim().toUpperCase(java.util.Locale.ROOT);
        return switch (normalized) {
            case "BASE", "MANDATORY" -> MANDATORY;
            case "OPTION", "OPTIONAL" -> OPTIONAL;
            case "ALTERNATIVE", "CHOICE_OPTION" -> CHOICE_OPTION;
            default -> throw new IllegalArgumentException("Unknown ServiceItemKind: " + raw);
        };
    }
}
