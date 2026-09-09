package com.task.management.config;

import com.task.management.config.security.CustomUserDetailsService;
import com.task.management.config.security.JwtTokenProvider;
import com.task.management.config.security.WebSocketJwtAuthInterceptor;
import com.task.management.entity.User;
import com.task.management.enums.Role;
import com.task.management.repository.ProjectMemberRepository;
import com.task.management.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class WebSocketConfigTest {

    @InjectMocks
    private WebSocketJwtAuthInterceptor interceptor;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Test
    public void testConnect_WithValidJwt_ShouldSucceed() {
        String validToken = "valid.jwt.token";
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(validToken)).thenReturn("testuser");

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.setNativeHeader("Authorization", "Bearer " + validToken);

        interceptor.preSend(MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders()), null);

        assertNotNull(accessor.getUser());
        assertEquals("testuser", accessor.getUser().getName());
    }

    @Test
    public void testConnect_WithInvalidJwt_ShouldThrowException() {
        String invalidToken = "invalid.jwt.token";
        when(tokenProvider.validateToken(invalidToken)).thenReturn(false);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.setNativeHeader("Authorization", "Bearer " + invalidToken);

        assertThrows(MessageDeliveryException.class, () -> {
            interceptor.preSend(MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders()), null);
        });
    }

    @Test
    public void testSubscribe_ProjectMember_ShouldSucceed() {
        String username = "memberUser";
        User user = new User();
        user.setId(10L);
        user.setUsername(username);
        user.setRole(Role.MEMBER);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(projectMemberRepository.existsByProjectIdAndUserId(1L, 10L)).thenReturn(true);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/projects/1");
        accessor.setUser(new UsernamePasswordAuthenticationToken(username, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_MEMBER"))));

        assertDoesNotThrow(() -> {
            interceptor.preSend(MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders()), null);
        });
    }

    @Test
    public void testSubscribe_NonProjectMember_ShouldThrowException() {
        String username = "outsiderUser";
        User user = new User();
        user.setId(20L);
        user.setUsername(username);
        user.setRole(Role.MEMBER);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(projectMemberRepository.existsByProjectIdAndUserId(1L, 20L)).thenReturn(false);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/projects/1");
        accessor.setUser(new UsernamePasswordAuthenticationToken(username, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_MEMBER"))));

        assertThrows(MessageDeliveryException.class, () -> {
            interceptor.preSend(MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders()), null);
        });
    }
}

