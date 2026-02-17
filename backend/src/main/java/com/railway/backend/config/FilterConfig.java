package com.railway.backend.config;

import com.railway.backend.audit.AuditLoggingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class FilterConfig {
    private final AuditLoggingFilter auditLoggingFilter;

    @Bean
    public FilterRegistrationBean<AuditLoggingFilter> auditFilter() {
        FilterRegistrationBean<AuditLoggingFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(auditLoggingFilter);
        registrationBean.addUrlPatterns("/*");
        return registrationBean;
    }
}
