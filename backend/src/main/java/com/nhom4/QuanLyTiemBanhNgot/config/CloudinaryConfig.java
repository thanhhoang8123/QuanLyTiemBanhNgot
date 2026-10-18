package com.nhom4.QuanLyTiemBanhNgot.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.env.Environment;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

@Configuration
public class CloudinaryConfig {

    @Bean
    @Conditional(CloudinaryConfiguredCondition.class)
    public Cloudinary cloudinary(Environment environment) {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", environment.getRequiredProperty("cloudinary.cloud-name").trim(),
                "api_key", environment.getRequiredProperty("cloudinary.api-key"),
                "api_secret", environment.getRequiredProperty("cloudinary.api-secret"),
                "secure", true));
    }

    static class CloudinaryConfiguredCondition implements Condition {

        private static final String[] REQUIRED_PROPERTIES = {
                "cloudinary.cloud-name",
                "cloudinary.api-key",
                "cloudinary.api-secret"
        };

        @Override
        public boolean matches(
                ConditionContext context,
                AnnotatedTypeMetadata metadata) {
            Environment environment = context.getEnvironment();

            for (String property : REQUIRED_PROPERTIES) {
                if (!StringUtils.hasText(environment.getProperty(property))) {
                    return false;
                }
            }

            return true;
        }
    }
}
