package com.surework.notification.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

/**
 * WebSocket configuration for real-time notification delivery.
 * Uses STOMP protocol over WebSocket with SockJS fallback.
 */
@Configuration
@EnableWebSocketMessageBroker
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory message broker for subscriptions
        // /topic for broadcast messages (all users)
        // /queue for user-specific messages
        // Configure heartbeat: server sends every 10s, expects client every 10s
        config.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10000, 10000})
                .setTaskScheduler(new org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler() {{
                    setPoolSize(1);
                    setThreadNamePrefix("ws-heartbeat-");
                    initialize();
                }});

        // Prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific destinations
        // When sending to a user, the destination becomes /user/{userId}/queue/notifications
        config.setUserDestinationPrefix("/user");

        log.info("Configured WebSocket message broker with /topic, /queue destinations and heartbeat");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        // Increase timeouts and buffer sizes for stability
        registry.setMessageSizeLimit(128 * 1024);  // 128KB max message size
        registry.setSendBufferSizeLimit(512 * 1024);  // 512KB send buffer
        registry.setSendTimeLimit(20 * 1000);  // 20 seconds to send a message
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint for clients to connect
        // Supports SockJS fallback for browsers that don't support WebSocket
        registry.addEndpoint("/ws/notifications")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setStreamBytesLimit(512 * 1024)  // 512KB for streaming
                .setHttpMessageCacheSize(1000)  // Cache up to 1000 messages
                .setDisconnectDelay(30 * 1000)  // 30 seconds before declaring disconnect
                .setHeartbeatTime(25 * 1000);  // SockJS heartbeat every 25 seconds

        // Raw WebSocket endpoint without SockJS (for clients that prefer raw WebSocket)
        registry.addEndpoint("/ws/notifications")
                .setAllowedOriginPatterns("*");

        log.info("Registered STOMP endpoints at /ws/notifications with SockJS fallback");
    }
}
