package com.railway.backend.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;

@Component
public class AuditLoggingFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(AuditLoggingFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        logger.info("AUDIT: {} {} from {}", req.getMethod(), req.getRequestURI(), req.getRemoteAddr());
        chain.doFilter(request, response);
    }
}
