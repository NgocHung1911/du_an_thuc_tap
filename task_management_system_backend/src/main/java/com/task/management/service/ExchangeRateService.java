package com.task.management.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lấy và cache tỷ giá VND -> USD từ nguồn công khai (ExchangeRate-API, miễn phí không cần key).
 *
 * Giả định:
 * - Nguồn: https://open.er-api.com/v6/latest/VND (không cần API key, giới hạn 1500 req/tháng)
 * - Refresh: mỗi 6 giờ bằng @Scheduled
 * - Fallback: nếu fetch lỗi, dùng tỷ giá lưu gần nhất + đánh dấu isFallback=true
 * - Nếu chưa có tỷ giá nào cả (khởi động lần đầu + lỗi): dùng fallback cứng 25000 VND/USD
 *
 * Lưu ý: SePay và số tiền đơn hàng LUÔN dùng VNĐ. USD chỉ hiển thị tham khảo trên UI.
 */
@Service
@Slf4j
public class ExchangeRateService {

    private static final String EXCHANGE_API_URL = "https://open.er-api.com/v6/latest/VND";
    private static final long HARD_CODED_FALLBACK_VND_PER_USD = 25_000L;
    private static final Pattern USD_RATE_PATTERN = Pattern.compile("\"USD\"\\s*:\\s*([0-9.]+(?:[eE][-+]?[0-9]+)?)");

    private volatile BigDecimal cachedUsdPerVnd = null; // USD mua được từ 1 VND
    private volatile Instant cachedAt = null;
    private volatile boolean isFallback = false;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /**
     * Trả về tỷ giá 1 VND = ? USD, cùng trạng thái fallback.
     * Caller dùng để hiển thị giá USD: priceVnd * usdPerVnd.
     */
    public ExchangeRateResult getUsdPerVnd() {
        if (cachedUsdPerVnd == null) {
            // Lần đầu chưa có cache, thử fetch ngay
            fetchAndCache();
        }
        if (cachedUsdPerVnd == null) {
            // Vẫn null sau khi fetch (lỗi), dùng fallback cứng
            BigDecimal fallbackRate = BigDecimal.ONE.divide(
                    BigDecimal.valueOf(HARD_CODED_FALLBACK_VND_PER_USD), 10, RoundingMode.HALF_UP);
            return new ExchangeRateResult(fallbackRate, true, Instant.now());
        }
        return new ExchangeRateResult(cachedUsdPerVnd, isFallback, cachedAt);
    }

    /**
     * Tính giá USD từ số VNĐ.
     * Kết quả làm tròn đến 2 chữ số thập phân.
     */
    public PriceInUsd convertVndToUsd(long amountVnd) {
        ExchangeRateResult rate = getUsdPerVnd();
        BigDecimal usd = BigDecimal.valueOf(amountVnd)
                .multiply(rate.usdPerVnd())
                .setScale(2, RoundingMode.HALF_UP);
        return new PriceInUsd(usd, rate.isFallback(), rate.rateUpdatedAt());
    }

    /** Refresh tỷ giá mỗi 6 giờ (UTC). */
    @Scheduled(fixedDelay = 6 * 60 * 60 * 1000L)
    public void scheduledRefresh() {
        fetchAndCache();
    }

    private synchronized void fetchAndCache() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(EXCHANGE_API_URL))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null) {
                Matcher matcher = USD_RATE_PATTERN.matcher(response.body());
                if (matcher.find()) {
                    double usdRate = Double.parseDouble(matcher.group(1));
                    cachedUsdPerVnd = BigDecimal.valueOf(usdRate).setScale(10, RoundingMode.HALF_UP);
                    cachedAt = Instant.now();
                    isFallback = false;
                    log.debug("Exchange rate refreshed: 1 VND = {} USD", cachedUsdPerVnd);
                } else {
                    markFallback("USD rate pattern not found in response");
                }
            } else {
                markFallback("HTTP " + response.statusCode());
            }
        } catch (Exception e) {
            markFallback(e.getMessage());
        }
    }

    private void markFallback(String reason) {
        log.warn("Cannot fetch live exchange rate ({}), using cached/fallback rate.", reason);
        if (cachedUsdPerVnd != null) {
            isFallback = true; // giữ cache cũ, đánh dấu là fallback
        }
    }

    public record ExchangeRateResult(BigDecimal usdPerVnd, boolean isFallback, Instant rateUpdatedAt) {}
    public record PriceInUsd(BigDecimal usd, boolean isFallback, Instant rateUpdatedAt) {}
}
