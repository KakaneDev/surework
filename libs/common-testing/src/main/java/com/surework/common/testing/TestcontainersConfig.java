package com.surework.common.testing;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Testcontainers configuration for integration tests.
 * Provides PostgreSQL 16, Redis 7, and Kafka containers.
 *
 * Usage: @Import(TestcontainersConfig.class) on test classes
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfig {

    private static final String POSTGRES_IMAGE = "postgres:16-alpine";
    private static final String REDIS_IMAGE = "redis:7-alpine";
    private static final String KAFKA_IMAGE = "confluentinc/cp-kafka:7.5.0";

    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse(POSTGRES_IMAGE))
                .withDatabaseName("surework_test")
                .withUsername("test")
                .withPassword("test")
                .withReuse(true);
    }

    @Bean
    @ServiceConnection(name = "redis")
    public GenericContainer<?> redisContainer() {
        return new GenericContainer<>(DockerImageName.parse(REDIS_IMAGE))
                .withExposedPorts(6379)
                .withReuse(true);
    }

    @Bean
    @ServiceConnection
    public KafkaContainer kafkaContainer() {
        return new KafkaContainer(DockerImageName.parse(KAFKA_IMAGE))
                .withKraft()
                .withReuse(true);
    }
}
