# 참여 인력·대표 프로젝트 이미지 자료 수집

## 폴더 구조

- `public/assets/projects/source-candidates/`: 1차 수집 이미지 후보. 사용권과 건축물 저작권 검토 전 자료.
- `public/assets/projects/approved/`: 홈페이지에 실제 사용하기로 확정한 이미지.
- `public/assets/projects/needs-permission/`: 공식/언론/회사 이미지 등 사용 허가 확인이 필요한 자료.
- `public/assets/projects/illustration-placeholders/`: 실사 사용이 어려울 때 대체할 라인드로잉/BIM 스타일 이미지.
- `docs/project-image-research/image-candidates.commons.json`: Wikimedia Commons 기반 1차 후보와 출처 메타데이터.

## 1차 수집 결과

| 인물 | 프로젝트 | 상태 | 후보 파일 |
|---|---|---|---|
| 김종호 | 롯데월드타워 | 후보 수집됨, 사용권 검토 필요 | `public/assets/projects/source-candidates/롯데월드타워__commons-candidate.jpg` |
| 김종호 | 서울 IFC | 후보 수집됨, 사용권 검토 필요 | `public/assets/projects/source-candidates/서울-ifc__commons-candidate.jpg` |
| 김종호 | 송도 더 퍼스트월드 | 후보 수집됨, 사용권 검토 필요 | `public/assets/projects/source-candidates/송도-더-퍼스트월드__commons-candidate.jpg` |
| 정광량 | 해운대 LCT | 후보 수집됨, 사용권 검토 필요 | `public/assets/projects/source-candidates/해운대-lct__commons-candidate.jpg` |
| 정광량 | Northeast Asia Trade Tower | 후보 수집됨, 사용권 검토 필요 | `public/assets/projects/source-candidates/northeast-asia-trade-tower__commons-candidate.jpg` |
| 정광량 | Parc1 Tower | 후보 수집됨, 사용권 검토 필요 | `public/assets/projects/source-candidates/parc1-tower__commons-candidate.jpg` |
| 정광량 | Keangnam Hanoi Landmark Tower | 후보 수집됨, 사용권 검토 필요 | `public/assets/projects/source-candidates/keangnam-hanoi-landmark-tower__commons-candidate.jpg` |
| 김종수 | Philippine Arena | 후보는 찾았으나 다운로드 실패, 재시도 필요 | `image-candidates.commons.json` 참조 |
| 김종수 | 전주월드컵경기장 | 후보는 찾았으나 다운로드 실패, 재시도 필요 | `image-candidates.commons.json` 참조 |
| 이상현 | 아크로서울포레스트 D타워 | Commons 후보 없음 | 공식/허가 이미지 필요 |
| 이상현/정란 | 테크노마트 | Commons 검색 실패 | 공식/허가 이미지 또는 대체 일러스트 필요 |
| 위진복 | 오사카 엑스포 한국관 | Commons 검색 실패 | 공식/허가 이미지 필요 |
| 위진복 | Pi-ville 99 | Commons 검색 실패 | 공식/허가 이미지 필요 |
| 강태웅 | 목조건축/목조주택 | Commons 검색 실패 | 직접 제공 이미지 또는 대체 일러스트 필요 |

## 사용 전 검토 기준

1. 이미지 라이선스가 `CC BY`, `CC BY-SA`, `Public domain` 등인지 확인한다.
2. 저작자 표시가 필요한 경우 홈페이지 하단 또는 이미지 캡션에 크레딧을 붙인다.
3. 한국 건축물 사진은 공개 라이선스여도 파노라마권 이슈가 있을 수 있으므로, 공식 제공 이미지나 자체 제작 대체 이미지가 더 안전하다.
4. 홍보 메인 화면에는 권리 검토가 끝난 이미지만 `approved`로 옮겨 사용한다.
5. 권리 확인이 어려운 이미지는 실사 대신 라인드로잉, 구조 다이어그램, BIM 스타일 렌더로 대체한다.

## 다음 작업

1. 공식 이미지 확보 가능 프로젝트를 우선 확인한다.
2. 다운로드 실패한 `Philippine Arena`, `전주월드컵경기장` 후보를 재시도한다.
3. Commons 후보가 없는 프로젝트는 공식 페이지/회사 자료/대체 일러스트 후보로 분류한다.
4. 최종 승인 이미지를 `approved` 폴더로 이동하고 `people-projects.draft.json`의 이미지 경로를 갱신한다.
