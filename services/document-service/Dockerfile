FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S surework && adduser -S surework -G surework
COPY target/*.jar app.jar
RUN chown -R surework:surework /app
USER surework
EXPOSE 8089
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
