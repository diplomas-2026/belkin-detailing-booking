package com.company.product.api.service;

import com.company.product.api.dto.AuthDtos;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       JwtService jwtService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.email());
        String token = jwtService.generateToken(userDetails);
        UserEntity user = userRepository.findByEmail(request.email()).orElseThrow();
        return new AuthDtos.LoginResponse(token, toUserView(user));
    }

    public AuthDtos.UserView me(String email) {
        UserEntity user = userRepository.findByEmail(email).orElseThrow();
        return toUserView(user);
    }

    public AuthDtos.LoginResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Пользователь с таким email уже существует");
        }

        UserEntity user = new UserEntity();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setRole(Role.CLIENT);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(userDetails);
        return new AuthDtos.LoginResponse(token, toUserView(user));
    }

    private AuthDtos.UserView toUserView(UserEntity user) {
        return new AuthDtos.UserView(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }
}
