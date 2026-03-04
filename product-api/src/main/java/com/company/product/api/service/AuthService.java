package com.company.product.api.service;

import com.company.product.api.dto.AuthDtos;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthService(AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       JwtService jwtService,
                       UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
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

    private AuthDtos.UserView toUserView(UserEntity user) {
        return new AuthDtos.UserView(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }
}
