package com.task.management.config.security;

import com.task.management.entity.User;
import com.task.management.enums.Role;
import com.task.management.repository.ProjectMemberRepository;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketJwtAuthInterceptor implements ChannelInterceptor {

    private static final Pattern PROJECT_TOPIC_PATTERN = Pattern.compile("^/(?:app/|topic/)?projects/(\\d+)(?:/.*)?$");

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                handleConnect(accessor);
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                handleSubscribe(accessor);
            }
        }
        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String token = extractToken(accessor);

        if (!StringUtils.hasText(token) || !tokenProvider.validateToken(token)) {
            log.warn("WebSocket CONNECT rejected: Invalid or missing JWT token");
            throw new MessageDeliveryException("Unauthorized: Invalid JWT token");
        }

        String username = tokenProvider.getUsernameFromToken(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        accessor.setUser(authentication);
        log.info("WebSocket connection established for user: {}", username);
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null) {
            log.warn("WebSocket SUBSCRIBE rejected: Unauthenticated user");
            throw new MessageDeliveryException("Unauthorized: User is not authenticated");
        }

        String destination = accessor.getDestination();
        if (destination == null) return;

        Matcher matcher = PROJECT_TOPIC_PATTERN.matcher(destination);
        if (matcher.matches()) {
            Long projectId = Long.parseLong(matcher.group(1));
            String username = principal.getName();

            User user = userRepository.findByUsername(username).orElse(null);
            if (user == null) {
                throw new MessageDeliveryException("Unauthorized: User not found");
            }

            if (user.getRole() == Role.ADMIN) {
                return;
            }

            boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId());
            if (!isMember) {
                log.warn("WebSocket SUBSCRIBE forbidden: User {} tried to subscribe to project {} without membership", username, projectId);
                throw new MessageDeliveryException("Forbidden: You are not a member of this project");
            }
        }
    }

    private String extractToken(StompHeaderAccessor accessor) {
        List<String> authorization = accessor.getNativeHeader("Authorization");
        if (authorization != null && !authorization.isEmpty()) {
            String bearerToken = authorization.get(0);
            if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
                return bearerToken.substring(7);
            }
            return bearerToken;
        }

        List<String> tokenHeader = accessor.getNativeHeader("token");
        if (tokenHeader != null && !tokenHeader.isEmpty()) {
            return tokenHeader.get(0);
        }

        return null;
    }
}
