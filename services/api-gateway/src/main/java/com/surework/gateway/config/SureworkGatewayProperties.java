package com.surework.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration properties for SureWork API Gateway.
 */
@Component
@ConfigurationProperties(prefix = "surework.gateway")
public class SureworkGatewayProperties {

    private JwtConfig jwt = new JwtConfig();
    private List<String> publicPaths = new ArrayList<>();

    public JwtConfig getJwt() {
        return jwt;
    }

    public void setJwt(JwtConfig jwt) {
        this.jwt = jwt;
    }

    public List<String> getPublicPaths() {
        return publicPaths;
    }

    public void setPublicPaths(List<String> publicPaths) {
        this.publicPaths = publicPaths;
    }

    public static class JwtConfig {
        private String secret;
        private String header = "Authorization";
        private String prefix = "Bearer";

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public String getHeader() {
            return header;
        }

        public void setHeader(String header) {
            this.header = header;
        }

        public String getPrefix() {
            return prefix;
        }

        public void setPrefix(String prefix) {
            this.prefix = prefix;
        }
    }
}
