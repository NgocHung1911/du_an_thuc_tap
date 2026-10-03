package com.task.management.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class SepayWebhookPayloadDTO {
    private Long id;                     // ID giao dịch nội bộ SePay
    private String gateway;              // Tên ngân hàng (MB, VCB,...)
    private String transactionDate;      // Thời gian giao dịch
    private String accountNumber;        // Số tài khoản ngân hàng
    private String code;                 // Mã code (nếu có)
    private String content;              // Nội dung chuyển khoản (chứa orderCode)
    private String transferType;         // "in" (tiền vào) hoặc "out" (tiền ra)
    private BigDecimal transferAmount;   // Số tiền giao dịch
    private BigDecimal accumulated;      // Số dư lũy kế
    private String subAccount;           // Tài khoản phụ
    private String referenceCode;        // Mã tham chiếu ngân hàng
    private String description;          // Mô tả đầy đủ
}
