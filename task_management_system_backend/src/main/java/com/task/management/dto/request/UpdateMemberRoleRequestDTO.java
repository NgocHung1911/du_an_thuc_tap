package com.task.management.dto.request;

import com.task.management.enums.ProjectRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberRoleRequestDTO {

    @NotNull(message = "Vai trò (role) không được để trống")
    private ProjectRole role;
}
