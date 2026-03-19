---
description: 개발 내용의 검증을 위한 개발 서버를 8081 포트로 구동하고 접속 IP를 표시합니다.
---

1. 프로젝트 루트 디렉토리에서 Python을 이용해 HTTP 서버를 구동합니다.
// turbo
2. `python3 -m http.server 8081 --directory .` 명령어를 실행하여 서버를 시작합니다.
3. 로컬 네트워크 IP 주소를 확인합니다.
// turbo
4. `ipconfig getifaddr en0 || ipconfig getifaddr en1 || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'` 명령어를 실행합니다.
5. 확인된 IP와 8081 포트를 결합하여 접속 가능한 주소(예: `http://192.168.x.x:8081`)를 사용자에게 안내합니다.
