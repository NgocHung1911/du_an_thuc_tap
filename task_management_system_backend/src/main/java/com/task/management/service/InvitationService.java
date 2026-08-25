package com.task.management.service;

import com.task.management.dto.request.InviteMemberRequestDTO;
import com.task.management.dto.response.AcceptInvitationResponseDTO;
import com.task.management.dto.response.InvitationVerifyResponseDTO;
import com.task.management.entity.Project;
import com.task.management.entity.ProjectInvitation;
import com.task.management.entity.ProjectMember;
import com.task.management.entity.User;
import com.task.management.enums.InvitationStatus;
import com.task.management.enums.ProjectRole;
import com.task.management.exception.BadRequestException;
import com.task.management.exception.ResourceNotFoundException;
import com.task.management.repository.ProjectInvitationRepository;
import com.task.management.repository.ProjectRepository;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final ProjectInvitationRepository projectInvitationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final BrevoMailService brevoMailService;

    @Transactional
    public AcceptInvitationResponseDTO sendInvitation(Long projectId, InviteMemberRequestDTO request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email người được mời không được để trống!");
        }

        String recipientEmail = request.getEmail().trim().toLowerCase();

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

        // 1. Kiểm tra xem người được mời có phải là Chủ sở hữu (Owner) dự án hay không
        if (project.getUser() != null) {
            String ownerEmail = project.getUser().getEmail();
            String ownerUsername = project.getUser().getUsername();
            if ((ownerEmail != null && recipientEmail.equalsIgnoreCase(ownerEmail)) ||
                (ownerUsername != null && recipientEmail.equalsIgnoreCase(ownerUsername))) {
                throw new BadRequestException("Email " + recipientEmail + " chính là Chủ sở hữu (Owner) của dự án này!");
            }
        }

        // 2. Kiểm tra xem user đã ở trong dự án chưa
        if (project.getMembers() != null) {
            boolean isAlreadyMember = project.getMembers().stream()
                    .anyMatch(m -> m.getUser() != null &&
                                   ((m.getUser().getEmail() != null && recipientEmail.equalsIgnoreCase(m.getUser().getEmail())) ||
                                    (m.getUser().getUsername() != null && recipientEmail.equalsIgnoreCase(m.getUser().getUsername()))));
            if (isAlreadyMember) {
                throw new BadRequestException("Thành viên (" + recipientEmail + ") đã tham gia vào dự án này rồi!");
            }
        }

        // Vô hiệu hóa tất cả các lời mời PENDING cũ cho Email & Dự án này (tránh lặp/rác DB & NonUniqueResultException)
        java.util.List<ProjectInvitation> oldPendingInvitations = projectInvitationRepository.findAllByEmailAndProjectIdAndStatus(recipientEmail, projectId, InvitationStatus.PENDING);
        if (oldPendingInvitations != null && !oldPendingInvitations.isEmpty()) {
            for (ProjectInvitation oldInvite : oldPendingInvitations) {
                oldInvite.setStatus(InvitationStatus.EXPIRED);
            }
            projectInvitationRepository.saveAll(oldPendingInvitations);
        }

        // Sinh token UUID duy nhất và thời gian hết hạn (48h)
        String token = UUID.randomUUID().toString();

        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setEmail(recipientEmail);
        invitation.setToken(token);
        invitation.setProject(project);
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setExpiresAt(LocalDateTime.now().plusHours(48));

        projectInvitationRepository.save(invitation);

        String inviteLink = "http://localhost:5173/accept-invite?token=" + token;
        boolean mailSent = brevoMailService.sendInvitationEmail(recipientEmail, project.getName(), inviteLink);

        String message;
        if (mailSent) {
            message = "Đã gửi email lời mời thành công đến " + recipientEmail + "!";
        } else {
            message = "Đã tạo lời mời thành công! (Lưu ý: Mail chưa gửi được do Sender chưa xác thực trên Brevo/SMTP. Bạn có thể sử dụng liên kết trực tiếp này để thử nghiệm: " + inviteLink + ")";
        }

        return AcceptInvitationResponseDTO.builder()
                .message(message)
                .projectId(project.getId())
                .projectName(project.getName())
                .build();
    }

    @Transactional
    public InvitationVerifyResponseDTO verifyInvitation(String token) {
        String cleanToken = token != null ? token.trim() : "";
        log.info(">>> [VERIFY INVITATION] Checking token: '{}'", cleanToken);

        if (cleanToken.isEmpty()) {
            throw new BadRequestException("Token xác nhận lời mời không hợp lệ!");
        }

        ProjectInvitation invitation = projectInvitationRepository.findByToken(cleanToken)
                .orElseThrow(() -> new ResourceNotFoundException("Mã lời mời không tồn tại hoặc không hợp lệ!"));

        LocalDateTime now = LocalDateTime.now();
        boolean isExpired = invitation.getExpiresAt() != null && now.isAfter(invitation.getExpiresAt());
        if (isExpired && invitation.getStatus() != InvitationStatus.EXPIRED) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            projectInvitationRepository.save(invitation);
        }

        String targetEmail = invitation.getEmail() != null ? invitation.getEmail().trim().toLowerCase() : "";
        boolean isRegistered = false;

        // Tối ưu: 1 query duy nhất kiểm tra email thay vì gọi chuỗi 5 query OR
        if (!targetEmail.isEmpty()) {
            isRegistered = userRepository.existsByEmail(targetEmail);
        }

        // Nếu người dùng hiện đang đăng nhập qua JWT SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            isRegistered = true;
        }

        boolean isAccepted = invitation.getStatus() == InvitationStatus.ACCEPTED;
        boolean isValid = !isExpired && invitation.getStatus() != InvitationStatus.EXPIRED;

        return InvitationVerifyResponseDTO.builder()
                .token(invitation.getToken())
                .email(invitation.getEmail())
                .projectId(invitation.getProject().getId())
                .projectName(invitation.getProject().getName())
                .projectDescription(invitation.getProject().getDescription())
                .status(invitation.getStatus().name())
                .isRegistered(isRegistered)
                .isExpired(isExpired)
                .isAccepted(isAccepted)
                .isValid(isValid)
                .build();
    }

    @Transactional
    public AcceptInvitationResponseDTO acceptInvitation(String token) {
        String cleanToken = token != null ? token.trim() : "";
        log.info(">>> [ACCEPT INVITATION] Processing token: '{}'", cleanToken);

        if (cleanToken.isEmpty()) {
            throw new BadRequestException("Token lời mời không được để trống!");
        }

        ProjectInvitation invitation = projectInvitationRepository.findByToken(cleanToken)
                .orElseThrow(() -> new ResourceNotFoundException("Mã lời mời không tồn tại hoặc không hợp lệ!"));

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            log.info(">>> [ACCEPT INVITATION] Token ID={} is ALREADY ACCEPTED.", invitation.getId());
            return AcceptInvitationResponseDTO.builder()
                    .message("Lời mời này đã được chấp nhận trước đó.")
                    .projectId(invitation.getProject().getId())
                    .projectName(invitation.getProject().getName())
                    .build();
        }

        if (LocalDateTime.now().isAfter(invitation.getExpiresAt()) || invitation.getStatus() == InvitationStatus.EXPIRED) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            projectInvitationRepository.save(invitation);
            throw new BadRequestException("Lời mời này đã hết hạn! Vui lòng liên hệ Admin để gửi lại lời mời mới.");
        }

        // Tối ưu: Ưu tiên lấy User đang ĐĂNG NHẬP từ SecurityContext
        User currentUser = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String loggedInUsername = auth.getName();
            currentUser = userRepository.findByUsername(loggedInUsername).orElse(null);
        }

        // Nếu chưa đăng nhập, tra cứu User theo Email trong Token lời mời
        String targetEmail = invitation.getEmail() != null ? invitation.getEmail().trim().toLowerCase() : "";
        if (currentUser == null && !targetEmail.isEmpty()) {
            currentUser = userRepository.findByEmail(targetEmail).orElse(null);
        }

        if (currentUser == null) {
            throw new BadRequestException("Không tìm thấy tài khoản người dùng tương ứng. Vui lòng Đăng ký / Đăng nhập tài khoản trước khi nhận lời mời!");
        }

        Project project = invitation.getProject();
        if (project.getMembers() == null) {
            project.setMembers(new java.util.ArrayList<>());
        }

        final Long currentUserId = currentUser.getId();
        boolean alreadyMember = project.getMembers().stream()
                .anyMatch(m -> m.getUser() != null && m.getUser().getId().equals(currentUserId));
        if (!alreadyMember) {
            ProjectMember newMember = ProjectMember.builder()
                    .project(project)
                    .user(currentUser)
                    .role(ProjectRole.MEMBER)
                    .build();
            project.getMembers().add(newMember);
            projectRepository.save(project);
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        projectInvitationRepository.save(invitation);

        log.info(">>> [ACCEPT INVITATION SUCCESS] Added User ID={} ({}) to project_members for Project ID={} ({}), set status to ACCEPTED",
                currentUser.getId(), currentUser.getEmail(), project.getId(), project.getName());

        return AcceptInvitationResponseDTO.builder()
                .message("Chấp nhận lời mời thành công! Bạn đã tham gia vào dự án.")
                .projectId(project.getId())
                .projectName(project.getName())
                .build();
    }
}

