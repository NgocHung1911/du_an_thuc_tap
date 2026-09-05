package com.task.management.dto.response;

import com.task.management.enums.ProjectRole;
import com.task.management.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;
    private String username;
    private String email;
    private String fullName;
//    private String password;
    private Role role;
    private ProjectRole projectRole;
}