package com.surework.common.testing;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Meta-annotation for integration tests.
 * Provides Testcontainers with PostgreSQL, Redis, and Kafka.
 *
 * Usage:
 * <pre>
 * {@code
 * @IntegrationTest
 * class MyServiceIntegrationTest {
 *     // tests here
 * }
 * }
 * </pre>
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
@Import(TestcontainersConfig.class)
public @interface IntegrationTest {
}
