package com.task.management.dto.request;

import com.task.management.enums.SubscriptionPlan;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequestDTO {
    @NotNull(message = "Target plan is required")
    private SubscriptionPlan targetPlan;
}
