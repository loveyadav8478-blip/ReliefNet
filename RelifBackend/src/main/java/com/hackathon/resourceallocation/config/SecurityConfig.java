package com.hackathon.resourceallocation.config;

import com.hackathon.resourceallocation.security.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler))
                .authorizeHttpRequests(auth -> auth

                        // ── Public ────────────────────────────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/images/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/needs").hasAnyRole("REPORTER", "COORDINATOR", "ADMIN")

                        // ── REPORTER ──────────────────────────────────────────────
                        // /my must be declared BEFORE the wildcard /api/needs/* rule
                        .requestMatchers(HttpMethod.GET, "/api/needs/my").hasRole("REPORTER")
                        .requestMatchers(HttpMethod.GET, "/api/needs/{id}").hasAnyRole("VOLUNTEER", "COORDINATOR", "ADMIN", "REPORTER")

                        // ── VOLUNTEER ─────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,   "/api/tasks/by-volunteer/**").hasAnyRole("VOLUNTEER", "COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/tasks/*/status").hasAnyRole("VOLUNTEER", "COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET,   "/api/needs").hasAnyRole("VOLUNTEER", "COORDINATOR", "ADMIN","REPORTER")
                        .requestMatchers(HttpMethod.GET,   "/api/needs/map").hasAnyRole("VOLUNTEER", "COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET,   "/api/volunteers/*").hasAnyRole("VOLUNTEER", "COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT,   "/api/volunteers/*").hasAnyRole("VOLUNTEER", "COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/volunteers/*/availability").hasAnyRole("VOLUNTEER", "COORDINATOR", "ADMIN")

                        // ── COORDINATOR ───────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,   "/api/volunteers").hasAnyRole("COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.POST,  "/api/volunteers").hasAnyRole("COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.POST,  "/api/tasks").hasAnyRole("COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET,   "/api/tasks").hasAnyRole("COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET,   "/api/tasks/by-need/**").hasAnyRole("COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/needs/*/status").hasAnyRole("COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET,   "/api/needs/*/matches").hasAnyRole("COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.POST,  "/api/needs/*/analyze").hasAnyRole("COORDINATOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET,   "/api/dashboard/**").hasAnyRole("COORDINATOR", "ADMIN")

                        // ── ADMIN only ────────────────────────────────────────────
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/needs/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/volunteers/*").hasRole("ADMIN")

                        // ── Fallback ──────────────────────────────────────────────
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}