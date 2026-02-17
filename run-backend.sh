#!/bin/bash
# Railway Backend - Render PostgreSQL Setup

# Set Render PostgreSQL credentials
export DB_URL="jdbc:postgresql://railway_v3pl_user:cWUU8smbe7Ig2jJwmIzju70neBnW7BCN@dpg-d6a35an5r7bs73fgs510-a:5432/railway_v3pl"
export DB_USERNAME="railway_v3pl_user"
export DB_PASSWORD="cWUU8smbe7Ig2jJwmIzju70neBnW7BCN"
export SPRING_PROFILES_ACTIVE="render"

echo "============================================"
echo "Railway Backend - Render PostgreSQL Setup"
echo "============================================"
echo ""

# Check if JAR exists
if [ ! -f "backend/target/backend-0.0.1-SNAPSHOT.jar" ]; then
    echo "Building backend..."
    mvn -f backend/pom.xml clean package -q -DskipTests
    if [ $? -ne 0 ]; then
        echo "ERROR: Build failed!"
        exit 1
    fi
    echo "Build complete!"
fi

echo ""
echo "Configuration:"
echo "- Profile: render"
echo "- Database: Render PostgreSQL"
echo "- URL: $DB_URL"
echo ""
echo "Starting Railway Backend..."
echo ""

java -Dspring.profiles.active=render \
     -Dspring.datasource.url="$DB_URL" \
     -Dspring.datasource.username="$DB_USERNAME" \
     -Dspring.datasource.password="$DB_PASSWORD" \
     -jar backend/target/backend-0.0.1-SNAPSHOT.jar

read -p "Press Enter to exit"
