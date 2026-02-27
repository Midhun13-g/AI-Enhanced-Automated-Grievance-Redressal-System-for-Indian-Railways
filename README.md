# Project Documentation: AI-Enhanced Railway Grievance Redressal System

## Overview

A production-ready, microservices-based system for railway grievance redressal, featuring AI-powered complaint classification, real-time dashboards, and secure, scalable architecture.

## Architecture

- **Frontend:** React 18 (Vite, Tailwind CSS)
- **Backend:** Spring Boot 3 (Java 17, Spring Security, JPA, JWT, Kafka)
- **AI Service:** Python FastAPI (HuggingFace Transformers, Kafka)
- **Database:** PostgreSQL 15
- **Messaging:** Apache Kafka
- **Orchestration:** Docker & Docker Compose

## Features

- User authentication (JWT, role-based)
- Complaint submission, dashboard, and admin panel
- AI-based complaint classification and urgency scoring
- Audit logging, rate limiting, and input validation
- Full-text search, sorting, and color-coded ticketing
- Secure, scalable, and production-ready deployment

## Setup & Deployment

1. **Clone the repository**
2. **Configure environment variables** in `docker-compose.yml` and `application.yml`
3. **Build and start all services:**

   ```sh
   docker-compose up --build
   ```

4. **Access the app:**
   - Frontend: <http://localhost:3000>
   - Backend: <http://localhost:8080>
   - AI Service: <http://localhost:8000/health>
   - PostgreSQL: localhost:5432
   - Kafka: localhost:9092

## Testing

- Backend: JUnit tests in `src/test/java`
- Frontend: Run `npm test` in `frontend/`
- AI Service: Use FastAPI `/health` endpoint
- Manual: Use the UI to submit, view, and update complaints

## Security

- BCrypt password hashing
- JWT authentication
- Rate limiting (Bucket4j)
- Audit logging
- HTTPS-ready config
- Kafka authentication (configurable)

## Extending & Customizing

- Add new complaint categories in AI service
- Enhance dashboard UI/UX in React
- Integrate more analytics or notification services

## Authors & License

- Built by your team, 2026
- MIT License

## For Start Frontend & Backend 

- cd frontend
- npm run dev

- cd backend
- mvn spring-boot:run