package com.task.management.controller;

import com.task.management.dto.request.InviteMemberRequestDTO;
import com.task.management.dto.response.AcceptInvitationResponseDTO;
import com.task.management.dto.response.InvitationVerifyResponseDTO;
import com.task.management.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/projects/{projectId}/invite")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER')")
    public ResponseEntity<AcceptInvitationResponseDTO> sendInvitation(
            @PathVariable Long projectId,
            @Valid @RequestBody InviteMemberRequestDTO request) {
        AcceptInvitationResponseDTO response = invitationService.sendInvitation(projectId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/invitations/verify")
    public ResponseEntity<InvitationVerifyResponseDTO> verifyInvitation(@RequestParam String token) {
        return ResponseEntity.ok(invitationService.verifyInvitation(token));
    }

    @PostMapping("/invitations/accept")
    public ResponseEntity<AcceptInvitationResponseDTO> acceptInvitation(@RequestParam String token) {
        return ResponseEntity.ok(invitationService.acceptInvitation(token));
    }
}
