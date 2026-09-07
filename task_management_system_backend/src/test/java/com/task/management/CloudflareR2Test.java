package com.task.management;

import org.junit.jupiter.api.Test;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;
import java.nio.charset.StandardCharsets;

public class CloudflareR2Test {

    @Test
    public void testRealAccountR2Upload() {
        String accountId = "e803001cba0605663a60cce0c362ece8";
        String accessKey = "a9cc2f003f6b0ee325073f463a651833";
        String secretKey = "1815219e7d52e5b88e66cb362e7fe2a9aea0343be339c44241a7d21655f8267f";
        String bucketName = "kira-storage";
        String endpoint = "https://" + accountId + ".r2.cloudflarestorage.com";

        System.out.println("Testing R2 Upload with REAL Account ID: " + endpoint);
        try (S3Client s3Client = S3Client.builder()
                .region(Region.of("auto"))
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build()) {

            byte[] bytes = "Hello Cloudflare R2 Upload with Real Account ID!".getBytes(StandardCharsets.UTF_8);
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key("test-real-upload.txt")
                    .contentType("text/plain")
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes));
            System.out.println("SUCCESSFULLY UPLOADED TO CLOUDFLARE R2!");
        } catch (Exception e) {
            System.err.println("FAILED: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
