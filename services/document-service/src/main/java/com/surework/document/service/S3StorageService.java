package com.surework.document.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;

/**
 * AWS S3 / MinIO storage implementation.
 * For production use.
 */
@Service
@ConditionalOnProperty(name = "surework.document.storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    @Value("${surework.document.storage.s3.endpoint}")
    private String endpoint;

    @Value("${surework.document.storage.s3.region}")
    private String region;

    @Value("${surework.document.storage.s3.bucket}")
    private String bucket;

    @Value("${surework.document.storage.s3.access-key}")
    private String accessKey;

    @Value("${surework.document.storage.s3.secret-key}")
    private String secretKey;

    private S3Client s3Client;
    private S3Presigner presigner;

    @PostConstruct
    public void init() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .forcePathStyle(true) // Required for MinIO
                .build();

        this.presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();

        // Ensure bucket exists
        ensureBucketExists();
    }

    private void ensureBucketExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
        }
    }

    @Override
    public String store(String path, byte[] content, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(path)
                .contentType(contentType)
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(content));
        return path;
    }

    @Override
    public String store(String path, InputStream inputStream, long contentLength, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(path)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(inputStream, contentLength));
        return path;
    }

    @Override
    public byte[] retrieve(String path) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(path)
                .build();

        return s3Client.getObjectAsBytes(request).asByteArray();
    }

    @Override
    public String getDownloadUrl(String path, int expirationMinutes) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(path)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expirationMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

        return presigner.presignGetObject(presignRequest).url().toString();
    }

    @Override
    public String getUploadUrl(String path, String contentType, int expirationMinutes) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(path)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expirationMinutes))
                .putObjectRequest(putObjectRequest)
                .build();

        return presigner.presignPutObject(presignRequest).url().toString();
    }

    @Override
    public void delete(String path) {
        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(path)
                .build();

        s3Client.deleteObject(request);
    }

    @Override
    public boolean exists(String path) {
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(path)
                    .build();
            s3Client.headObject(request);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        }
    }

    @Override
    public long getSize(String path) {
        HeadObjectRequest request = HeadObjectRequest.builder()
                .bucket(bucket)
                .key(path)
                .build();

        return s3Client.headObject(request).contentLength();
    }

    @Override
    public String copy(String sourcePath, String destinationPath) {
        CopyObjectRequest request = CopyObjectRequest.builder()
                .sourceBucket(bucket)
                .sourceKey(sourcePath)
                .destinationBucket(bucket)
                .destinationKey(destinationPath)
                .build();

        s3Client.copyObject(request);
        return destinationPath;
    }
}
