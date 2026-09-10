package com.task.management.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.task.management.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadAvatar(MultipartFile file, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File upload cannot be empty.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed.");
        }

        String publicId = String.format("user-%d-%s", userId, UUID.randomUUID().toString().substring(0, 8));

        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "avatars",
                            "public_id", publicId,
                            "overwrite", true,
                            "resource_type", "image"
                    )
            );

            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            log.error("Failed to upload avatar to Cloudinary", e);
            throw new RuntimeException("Failed to upload image file to Cloudinary storage.", e);
        }
    }
}
