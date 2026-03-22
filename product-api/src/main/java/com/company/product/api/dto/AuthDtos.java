package com.company.product.api.dto;

import com.company.product.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record RegisterRequest(
            @NotBlank(message = "Укажите имя") String fullName,
            @Email(message = "Некорректный email") @NotBlank(message = "Укажите email") String email,
            @Size(min = 8, message = "Пароль должен быть не короче 8 символов") @NotBlank(message = "Укажите пароль") String password
    ) {}

    public record UserView(Long id, String fullName, String email, Role role) {}

    public record LoginResponse(String token, UserView user) {}
}
