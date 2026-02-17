# Set Render PostgreSQL credentials
$env:DB_URL = "jdbc:postgresql://dpg-d6a35an5r7bs73fgs510-a.oregon-postgres.render.com:5432/railway_v3pl"
$env:DB_USERNAME = "railway_v3pl_user"
$env:DB_PASSWORD = "cWUU8smbe7Ig2jJwmIzju70neBnW7BCN"
$env:SPRING_PROFILES_ACTIVE = "render"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Railway Backend - Render PostgreSQL Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if JAR exists
$jarPath = "backend/target/backend-0.0.1-SNAPSHOT.jar"
if (-Not (Test-Path $jarPath)) {
    Write-Host "Building backend..." -ForegroundColor Yellow
    
    $buildProcess = Start-Process -FilePath "mvn" -ArgumentList "-f", "backend/pom.xml", "clean", "package", "-q", "-DskipTests" -Wait -NoNewWindow -PassThru
    
    if ($buildProcess.ExitCode -ne 0) {
        Write-Host "ERROR: Build failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Build complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Green
Write-Host "- Profile: render" -ForegroundColor Green
Write-Host "- Database: Render PostgreSQL" -ForegroundColor Green
Write-Host "- URL: $env:DB_URL" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Railway Backend..." -ForegroundColor Cyan
Write-Host ""

java -Dspring.profiles.active=render `
     -Dspring.datasource.url="$env:DB_URL" `
     -Dspring.datasource.username="$env:DB_USERNAME" `
     -Dspring.datasource.password="$env:DB_PASSWORD" `
     -jar $jarPath

Read-Host "Press Enter to exit"
