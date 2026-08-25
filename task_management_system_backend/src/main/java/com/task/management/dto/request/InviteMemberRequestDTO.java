package com.task.management.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InviteMemberRequestDTO {

    @NotBlank(message = "Email người được mời không được để trống!")
    @Email(message = "Địa chỉ email không đúng định dạng!")
    private String email;
}

