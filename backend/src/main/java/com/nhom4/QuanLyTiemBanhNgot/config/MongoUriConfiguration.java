package com.nhom4.QuanLyTiemBanhNgot.config;

import com.mongodb.ConnectionString;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods = false)
public class MongoUriConfiguration {

    @Bean
    static BeanFactoryPostProcessor validateMongoUri(Environment environment) {
        return beanFactory -> requireValidMongoUri(resolveMongoUri(environment));
    }

    static String resolveMongoUri(Environment environment) {
        String uri = environment.getProperty("MONGODB_URI");
        if (uri == null || uri.isBlank()) {
            uri = environment.getProperty("spring.mongodb.uri");
        }
        if (uri == null || uri.isBlank()) {
            uri = environment.getProperty("spring.data.mongodb.uri");
        }
        return uri;
    }

    static void requireValidMongoUri(String uri) {
        if (uri == null || uri.isBlank()) {
            throw new IllegalStateException(
                    "MongoDB configuration is missing. Set MONGODB_URI or configure "
                            + "spring.mongodb.uri with a valid mongodb:// or mongodb+srv:// connection string.");
        }

        try {
            new ConnectionString(uri);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "MongoDB configuration is invalid. Check that MONGODB_URI or spring.mongodb.uri is a valid "
                            + "mongodb:// or mongodb+srv:// connection string; the URI value is not logged.");
        }
    }
}
