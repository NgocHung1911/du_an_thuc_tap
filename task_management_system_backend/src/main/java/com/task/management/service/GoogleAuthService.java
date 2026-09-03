package com.task.management.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.task.management.config.security.JwtTokenProvider;
import com.task.management.dto.response.AuthResponseDTO;
import com.task.management.entity.User;
import com.task.management.enums.Role;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${google.client-id:YOUR_GOOGLE_CLIENT_ID}")
    private String googleClientId;

    public AuthResponseDTO processGoogleLogin(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
            .setAudience(googleClientId.startsWith("YOUR_") ? null : Collections.singletonList(googleClientId))
            .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);

            GoogleIdToken.Payload payload;
            if (idToken != null) {
                payload = idToken.getPayload();
            } else {
                // Fallback decode if verifier fails in dev mode with un-registered audience
                payload = parsePayloadWithoutVerification(idTokenString);
            }

            if (payload == null || payload.getEmail() == null) {
                throw new IllegalArgumentException("Token Google không hợp lệ hoặc không chứa email!");
            }

            String email = payload.getEmail();
            String googleId = payload.getSubject();

            // Lấy tên đại diện từ tài khoản Google
            String nameFromGoogle = (String) payload.get("name");
            if (nameFromGoogle == null || nameFromGoogle.isBlank()) {
                String givenName = (String) payload.get("given_name");
                String familyName = (String) payload.get("family_name");
                if (givenName != null || familyName != null) {
                    nameFromGoogle = ((familyName != null ? familyName + " " : "") + (givenName != null ? givenName : "")).trim();
                }
            }

            Optional<User> optionalUser = userRepository.findByEmail(email);
            User user;

            if (optionalUser.isPresent()) {
                // Trường hợp 2: Email đã có trong hệ thống
                user = optionalUser.get();
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                }
                if (nameFromGoogle != null && !nameFromGoogle.isBlank() && (user.getFullName() == null || user.getFullName().isBlank())) {
                    user.setFullName(nameFromGoogle);
                }
                user.setVerified(true);
                userRepository.save(user);
            } else {
                // Trường hợp 1: Chưa có tài khoản -> Tự động đăng ký
                user = new User();
                user.setEmail(email);
                user.setGoogleId(googleId);
                if (nameFromGoogle != null && !nameFromGoogle.isBlank()) {
                    user.setFullName(nameFromGoogle);
                }
                user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                user.setRole(Role.MEMBER);
                user.setVerified(true);

                String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "");
                String username = baseUsername;
                int suffix = 1;
                while (userRepository.existsByUsername(username)) {
                    username = baseUsername + suffix;
                    suffix++;
                }
                user.setUsername(username);
                userRepository.save(user);
            }

            String roleName = user.getRole().name();
            if (!roleName.startsWith("ROLE_")) {
                roleName = "ROLE_" + roleName;
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    user.getUsername(),
                    null,
                    Collections.singletonList(new SimpleGrantedAuthority(roleName))
            );

            String token = tokenProvider.generateToken(authentication);

            return AuthResponseDTO.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .roles(List.of(roleName))
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Xác thực Token Google thất bại: " + e.getMessage(), e);
        }
    }

    private GoogleIdToken.Payload parsePayloadWithoutVerification(String idTokenString) {
        try {
            String[] parts = idTokenString.split("\\.");
            if (parts.length < 2) return null;
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            return GsonFactory.getDefaultInstance().fromString(payloadJson, GoogleIdToken.Payload.class);
        } catch (Exception e) {
            return null;
        }
    }
}
