package com.company.product.api.dto;

import com.company.product.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record UserView(Long id, String fullName, String email, Role role) {}

    public record LoginResponse(String token, UserView user) {}
}
