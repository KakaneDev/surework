# SureWork Analytics Service - Dockerfile
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true
COPY src/ src/
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S surework && adduser -S surework -G surework
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R surework:surework /app
USER surework

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8092/actuator/health || exit 1

EXPOSE 8092
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
