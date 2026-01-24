@echo off
REM UI Multi-Agent Review Pipeline Launcher
REM Usage: run-ui-pipeline.bat [max_iterations]

setlocal

set MAX_ITERATIONS=%1
if "%MAX_ITERATIONS%"=="" set MAX_ITERATIONS=50

echo.
echo ========================================
echo  AICaddyPro UI Pipeline Launcher
echo ========================================
echo.
echo Starting pipeline with max %MAX_ITERATIONS% iterations...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0ralph-ui-pipeline.ps1" -MaxIterations %MAX_ITERATIONS%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Pipeline completed successfully!
) else (
    echo.
    echo Pipeline did not complete. Check output for details.
)

pause
