@echo off
title AI건축융합학과 NLWeb-lite 로컬 개발 서버
echo =====================================================================
echo  [AI건축융합학과] 로컬 개발 서버 (Wrangler Pages Dev)를 기동합니다.
echo  - 로컬 접속 주소: http://localhost:8788
echo  - 외부 IP 바인딩: 모든 네트워크 인터페이스(0.0.0.0)로 노출 중
echo  - 종료하려면 이 창에서 Ctrl + C를 누르세요.
echo =====================================================================
echo.

:: 의존성 설치 확인 후 서버 기동
if not exist node_modules (
    echo [안내] 최초 실행을 위한 의존성 패키지를 설치 중입니다. 잠시만 기다려 주세요...
    call npm install
)

call npm run dev
pause
