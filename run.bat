@echo off
title SolSafe - Full Stack Java 21 Heat Safety Server
echo ===========================================================================
echo   SolSafe: Heat-Safe Delivery Routing ^& Rider Biometric Digital Twin
echo   Full Stack Java Development (JDK 21 / Spring Boot 3.3 Architecture)
echo ===========================================================================
echo.

where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Maven detected. Starting Spring Boot Backend on port 8050...
    cd backend
    mvn spring-boot:run
) else (
    echo [INFO] Compiling and starting JDK 21 Virtual-Thread Server on port 8050...
    if not exist "backend\target\classes" mkdir "backend\target\classes"
    javac -d "backend\target\classes" "backend\src\main\java\com\solsafe\heatsafety\server\StandaloneJavaServer.java"
    java -cp "backend\target\classes" com.solsafe.heatsafety.server.StandaloneJavaServer
)
