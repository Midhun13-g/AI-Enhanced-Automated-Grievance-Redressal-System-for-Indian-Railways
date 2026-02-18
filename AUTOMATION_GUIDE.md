# Automated Backend Startup

This directory contains automated scripts to build and run the Railway backend with Render PostgreSQL.

## Quick Start

### Windows (Cmd)

```batch
run-backend.bat
```

### Windows (PowerShell)

```powershell
.\run-backend.ps1
```

### macOS / Linux

```bash
chmod +x run-backend.sh
./run-backend.sh
```

## What Each Script Does

1. **Validates** the JAR file exists (builds it if missing)
2. **Sets** Render PostgreSQL credentials
3. **Configures** Spring profile to `render`
4. **Starts** the backend application with:
   - Active profile: `render`
   - Database: Your Render PostgreSQL instance
   - Automatic schema updates via Hibernate

## Features

✅ **Automatic Build** - Builds JAR if not present
✅ **Environment Setup** - Sets all necessary credentials
✅ **Profile Activation** - Uses `application-render.yml` config
✅ **Error Handling** - Validates build success before running
✅ **Logging** - Detailed startup information

## Application Profiles

The application supports these profiles:

- **dev** (`application-dev.yml`) - Uses in-memory H2 database
- **render** (`application-render.yml`) - Uses Render PostgreSQL
- **default** (`application.yml`) - Generic PostgreSQL config

### Running with Different Profiles

```batch
# Use dev profile (local testing)
java -Dspring.profiles.active=dev -jar backend/target/backend-0.0.1-SNAPSHOT.jar

# Use render profile (production)
java -Dspring.profiles.active=render -jar backend/target/backend-0.0.1-SNAPSHOT.jar
```

## Manual Startup

If you need more control, start manually:

```batch
# Set environment variables
set DB_URL=postgresql://railway_v3pl_user:cWUU8smbe7Ig2jJwmIzju70neBnW7BCN@dpg-d6a35an5r7bs73fgs510-a/railway_v3pl
set DB_USERNAME=railway_v3pl_user
set DB_PASSWORD=cWUU8smbe7Ig2jJwmIzju70neBnW7BCN

# Run backend
java -Dspring.profiles.active=render -jar backend/target/backend-0.0.1-SNAPSHOT.jar
```

## Troubleshooting

### Port Already in Use

Backend runs on port **8081**. If in use:

```batch
netstat -ano -p TCP | findstr :8081
taskkill /PID <PID> /F
```

### Database Connection Fails

- Verify Render PostgreSQL is running
- Check credentials in `.env` file
- Ensure internet connection is stable
- Check firewall doesn't block outbound connections

### Build Fails

```batch
# Full verbose build
mvn -f backend/pom.xml clean package
```

### Clear Cache & Rebuild

```batch
# Remove all built files
rmdir /s /q backend\target

# Rebuild
mvn -f backend/pom.xml clean package
```

## Accessing the Application

Once running:

- **API Base**: `http://localhost:8081`
- **Health Check**: `http://localhost:8081/actuator/health`
- **Login**: `POST /auth/login`
- **Complaints**: `GET /complaints`

## Stopping the Application

Press `Ctrl + C` in the terminal running the backend.

## CI/CD Integration

For deployment platforms (Render, GitHub Actions, etc.):

```bash
# Build
mvn clean package -DskipTests

# Run with environment variables
java -Dspring.profiles.active=render \
     -Dspring.datasource.url=$DB_URL \
     -Dspring.datasource.username=$DB_USERNAME \
     -Dspring.datasource.password=$DB_PASSWORD \
     -jar backend/target/backend-0.0.1-SNAPSHOT.jar
```
