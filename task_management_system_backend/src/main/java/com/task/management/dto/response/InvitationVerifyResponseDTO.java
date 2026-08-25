package com.task.management.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationVerifyResponseDTO {

    private String token;
    private String email;
    private Long projectId;
    private String projectName;
    private String projectDescription;
    private String status;

    @JsonProperty("isRegistered")
    private boolean isRegistered;

    @JsonProperty("isExpired")
    private boolean isExpired;

    @JsonProperty("isAccepted")
    private boolean isAccepted;

    @JsonProperty("isValid")
    private boolean isValid;
}

