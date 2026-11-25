@echo off
chcp 65001 > nul
echo ========================================================
echo   MBTI TEST 웹 앱 GitHub 푸시 스크립트
echo ========================================================
echo.
set "PATH=%USERPROFILE%\mingit\cmd;%PATH%"
cd /d "%~dp0"

echo [1/3] Git 상태 확인 중...
git status
echo.

echo [2/3] 원격 저장소로 푸시를 진행합니다...
echo (브라우저 로그인 창이 뜨면 GitHub 로그인을 승인해 주세요)
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   성공적으로 GitHub에 푸시되었습니다!
    echo   저장소 확인: https://github.com/chumincoding79-glitch/MBTI-TEST-WEP
    echo ========================================================
) else (
    echo.
    echo [!] 푸시 중 오류가 발생했습니다. GitHub 로그인 또는 권한을 확인해 주세요.
)

echo.
pause
