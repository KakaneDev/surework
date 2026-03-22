package com.surework.document.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;

/**
 * Local filesystem storage implementation.
 * For development and testing purposes.
 */
@Service
@ConditionalOnProperty(name = "surework.document.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final Path basePath;

    public LocalStorageService(@Value("${surework.document.storage.local.base-path:./document-storage}") String basePath) {
        this.basePath = Paths.get(basePath);
        try {
            Files.createDirectories(this.basePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create storage directory", e);
        }
    }

    @Override
    public String store(String path, byte[] content, String contentType) {
        try {
            Path filePath = basePath.resolve(path);
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, content);
            return path;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public String store(String path, InputStream inputStream, long contentLength, String contentType) {
        try {
            Path filePath = basePath.resolve(path);
            Files.createDirectories(filePath.getParent());
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            return path;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public byte[] retrieve(String path) {
        try {
            Path filePath = basePath.resolve(path);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to retrieve file", e);
        }
    }

    @Override
    public String getDownloadUrl(String path, int expirationMinutes) {
        // For local storage, return a relative path
        // In production, this would return a pre-signed URL
        return "/api/documents/download/" + path;
    }

    @Override
    public String getUploadUrl(String path, String contentType, int expirationMinutes) {
        // For local storage, return the API endpoint
        return "/api/documents/upload";
    }

    @Override
    public void delete(String path) {
        try {
            Path filePath = basePath.resolve(path);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    @Override
    public boolean exists(String path) {
        Path filePath = basePath.resolve(path);
        return Files.exists(filePath);
    }

    @Override
    public long getSize(String path) {
        try {
            Path filePath = basePath.resolve(path);
            return Files.size(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to get file size", e);
        }
    }

    @Override
    public String copy(String sourcePath, String destinationPath) {
        try {
            Path source = basePath.resolve(sourcePath);
            Path destination = basePath.resolve(destinationPath);
            Files.createDirectories(destination.getParent());
            Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
            return destinationPath;
        } catch (IOException e) {
            throw new RuntimeException("Failed to copy file", e);
        }
    }
}
