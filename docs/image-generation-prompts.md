# 교육 비유 이미지 제작 기록

방식: 내장 image_gen 도구. 인물 사진은 생성하지 않았습니다.

최종 자산: `public/assets/learning-tower-source.png` → `tools/build-learning-gif.mjs` → `public/assets/learning-tower.gif`, `public/assets/learning-tower-poster.png`.

초고층 타워 생성 프롬프트:

Use case: scientific-educational. Asset type: transparent architectural model source for a carefully animated educational GIF about building knowledge from theory upwards and real-world questions downwards. Create ONE isolated beautiful completed SUPERTALL SKYSCRAPER miniature on a truly transparent background. Portrait-oriented subject centered with full tower and base visible, 70 to 90 stories, elegantly tapered modern rectangular tower, discreet sky-blue clear glass facade, silver structural frame, visible fine regularly spaced horizontal floorplates, subtle solid central core, restrained cobalt-blue details, small pale concrete foundation slab. Realistic premium architectural physical model, orthographic near-front three-quarter view from slightly above the base, not extreme bird's-eye perspective. The skyscraper must be straight vertical, its width almost uniform until modest taper in uppermost quarter, not a fantasy curved tower. Distinct horizontal floor strata are critical because this image will be revealed in six aligned horizontal groups for a construction animation. Completed building, no exploded sections, no gaps, no detached objects. Soft neutral studio lighting, refined realistic glass and aluminium, Apple keynote product visual restraint. No surroundings, no ground plane extending beyond foundation, no skyline, no typography, no labels, no arrows, no numbers, no logos, no people, no neon, no purple, no sparkle effects. Entire tower visible with 8 percent clear margin all around. Transparent background, high resolution, crisp edges.

초기 저층 개념 이미지(현재 메인에서는 미사용): `public/assets/learning-architecture-v2.png`.

Use case: infographic-diagram. Asset type: a premium editorial architectural learning infographic for a Korean university department website. Generate one exquisitely minimal wide landscape 3:2 image, 2K quality. On a seamless near-white #f5f5f7 studio surface, show a single architectural pavilion as a carefully composed exploded physical model: a precise pale concrete structural base with thin cobalt-blue engineering measurement lines at left/front, slender brushed aluminium columns and floorplates at center, a very subtle translucent clear glass building envelope hovering above/right, and a tiny neatly arranged sensor grid on the floor. The viewer should understand that a real building, its underlying structure, and its measured information are connected. This is an architectural learning object, not a fantastical building. Beautiful realistic material rendering, gentle ambient daylight, soft contact shadows, subtle refractive glass edges, restrained Dankook deep blue accents, mostly white and silver. Sculptural simplicity and spatial clarity inspired by Apple developer keynote product illustration restraint; original composition, no Apple logos or copied branding. Single coherent object centered in the frame, generous negative space surrounding it; object fills about 65 percent width, calm orthographic three-quarter view. No typography at all, no labels, no letters or numbers, no arrows, no circular diagram, no chart, no dashboard, no UI cards, no gradients in the background, no neon, no purple, no glowing AI brain, no robots, no people, no decorative sparkles. The composition should feel designed by an architect and photographed in a product studio, with enough detail to see load-bearing columns, floorplates, and the transparent envelope.

GIF 연출: 완성 타워를 12개 수평 구간으로 나누어 아래쪽은 위로, 위쪽은 아래로 이동하며 서로 연결합니다. 완성 후 잠시 유지하고 부드럽게 사라지는 9.6초 루프입니다. 생성 이미지를 변경해 새 건축 형태를 만드는 대신 같은 원본의 구간을 정렬하여 애니메이션 프레임을 조립합니다. 실제 시공 공법을 설명하는 이미지가 아닙니다.

## 교육철학·심화 교육축 인포그래픽 (2026-11-17)

Built-in imagegen 사용. 두 스크린샷을 각각 참조하여 16:9·2K 요청, 흰 배경, 남색과 파랑·보라·금색, 사진 같은 건축 모형, 정확한 한국어, 짧은 레이블, 추가 문단 없음으로 생성했습니다. 원본 PNG는 public/assets/education-philosophy-infographic.png 및 education-axes-infographic.png에 복사했습니다.

프롬프트 요약: 교육철학은 난제→대안 비교, 실무 모형↔이론 서적, 관심→연구·프로젝트의 세 시각적 설명. 심화 교육축은 파랑의 건축 정보→디지털트윈→설계 대안 비교와 보라의 현장 데이터→해석·검증→성능·안전 판단을 건축 모형·구조 프레임·재료 시편으로 표현. 로고·장식 문구·안전 보장 표현은 제외했습니다.

## 졸업 후 진로 인포그래픽 (2026-11-17)

Built-in imagegen으로 첨부된 4개 진로 카드를 16:9·2K 요청의 2×2 사진형 건축 인포그래픽으로 재구성. 흰 배경과 남색 제목, 파랑·보라·금색·청록 포인트. 직무명과 결과물 문구를 유지하고 각 직무의 작업 흐름을 건축 모형·도면·소프트웨어 화면으로 표현. 후속 편집 프롬프트로 화면 안의 임의 공학 지시와 측정 수치를 없애고 관련 시방서 검색 / 근거 문서 확인, 정성적 차트로 교체. 로고·고용 보장·안전 인증은 제외. 최종 원본: public/assets/careers-infographic.png.
