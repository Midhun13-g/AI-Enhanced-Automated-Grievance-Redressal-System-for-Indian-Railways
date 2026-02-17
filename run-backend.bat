@echo off
setlocal enabledelayedexpansion

REM Set Render PostgreSQL credentials
set DB_URL=postgresql://railway_v3pl_user:cWUU8smbe7Ig2jJwmIzju70neBnW7BCN@dpg-d6a35an5r7bs73fgs510-a/railway_v3pl
set DB_USERNAME=railway_v3pl_user
set DB_PASSWORD=cWUU8smbe7Ig2jJwmIzju70neBnW7BCN
set SPRING_PROFILES_ACTIVE=render

echo ============================================
echo Railway Backend - Render PostgreSQL Setup
echo ============================================
echo.

REM Check if JAR exists
if not exist "backend\target\backend-0.0.1-SNAPSHOT.jar" (
    echo Building backend...
    call mvn -f backend\pom.xml clean package -q -DskipTests
    if errorlevel 1 (
        echo ERROR: Build failed!
        pause
        exit /b 1
    )
    echo Build complete!
)

echo.
echo Configuration:
echo - Profile: render
echo - Database: Render PostgreSQL
echo - URL: !DB_URL!
echo.
echo Starting Railway Backend...
echo.

java -Dspring.profiles.active=render ^
     -Dspring.datasource.url="!DB_URL!" ^
     -Dspring.datasource.username="!DB_USERNAME!" ^
     -Dspring.datasource.password="!DB_PASSWORD!" ^
     -jar backend\target\backend-0.0.1-SNAPSHOT.jar

pause
