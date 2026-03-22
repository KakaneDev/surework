package com.surework.document.service;

import java.io.InputStream;

/**
 * Interface for document storage operations.
 * Supports both local and S3/MinIO storage.
 */
public interface StorageService {

    /**
     * Store a file.
     * @param path The storage path
     * @param content The file content
     * @param contentType The MIME type
     * @return The full storage path
     */
    String store(String path, byte[] content, String contentType);

    /**
     * Store a file from stream.
     * @param path The storage path
     * @param inputStream The file content stream
     * @param contentLength The content length
     * @param contentType The MIME type
     * @return The full storage path
     */
    String store(String path, InputStream inputStream, long contentLength, String contentType);

    /**
     * Retrieve a file.
     * @param path The storage path
     * @return The file content
     */
    byte[] retrieve(String path);

    /**
     * Get a pre-signed download URL.
     * @param path The storage path
     * @param expirationMinutes URL expiration time in minutes
     * @return The pre-signed URL
     */
    String getDownloadUrl(String path, int expirationMinutes);

    /**
     * Get a pre-signed upload URL.
     * @param path The storage path
     * @param contentType The expected MIME type
     * @param expirationMinutes URL expiration time in minutes
     * @return The pre-signed URL
     */
    String getUploadUrl(String path, String contentType, int expirationMinutes);

    /**
     * Delete a file.
     * @param path The storage path
     */
    void delete(String path);

    /**
     * Check if a file exists.
     * @param path The storage path
     * @return true if the file exists
     */
    boolean exists(String path);

    /**
     * Get file size.
     * @param path The storage path
     * @return The file size in bytes
     */
    long getSize(String path);

    /**
     * Copy a file.
     * @param sourcePath The source path
     * @param destinationPath The destination path
     * @return The destination path
     */
    String copy(String sourcePath, String destinationPath);
}
