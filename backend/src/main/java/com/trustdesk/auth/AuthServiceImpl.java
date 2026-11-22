package com.trustdesk.auth;

import com.trustdesk.dto.AuthRequest;
import com.trustdesk.dto.AuthResponse;
import com.trustdesk.dto.RegisterRequest;
import com.trustdesk.dto.UserInfoResponse;
import com.trustdesk.entity.User;
import com.trustdesk.exception.BadRequestException;
import com.trustdesk.exception.ConflictException;
import com.trustdesk.exception.ResourceNotFoundException;
import com.trustdesk.repository.UserRepository;
import com.trustdesk.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUsername()));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already exists");
        }

        String roleName = request.getRole() == null || request.getRole().isBlank()
                ? User.Role.AGENT.name()
                : request.getRole().trim().toUpperCase();

        User.Role role;
        try {
            role = User.Role.valueOf(roleName);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("role must be AGENT or ADMIN");
        }

        userRepository.save(User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public UserInfoResponse me(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return new UserInfoResponse(user.getUsername(), user.getRole().name());
    }
}
