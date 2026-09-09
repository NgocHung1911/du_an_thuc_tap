package com.task.management.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResendOtpRequestDTO {

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email address")
    private String email;
}
