# Design Feedback

로컬 개발 환경에서 우측 하단 `디자인 피드백` 버튼을 눌러 화면 요소를 선택하고 코멘트를 남길 수 있다.

- 저장 위치: `docs/design-feedback/*.md`
- 저장 내용: 전체 URL, route path, 선택 요소 selector, 요소 위치/크기, 선택 요소 텍스트, 코멘트
- 노출 조건: `NODE_ENV !== "production"`

프로덕션 빌드에서는 위젯과 저장 API를 사용하지 않는다.
