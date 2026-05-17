# Current Feature Test Cases

작성일: 2026-05-13
상태: 검토용 초안
대상: 현재까지 구현된 LIFANG 관리자/유저 화면, 로컬 디자인 피드백 도구, 로딩 상태

## 테스트 전제

- 테스트는 PC 전용 화면 기준으로 작성한다.
- 모바일 전환 레이아웃은 테스트하지 않는다.
- 로컬 개발 환경에서는 임의 이메일/비밀번호로 로그인이 가능해야 한다.
- 인증이 필요한 화면은 미로그인 상태에서 접근 시 로그인 페이지로 이동해야 한다.
- 테스트 코드는 다음 단계에서 작성하며, 이 문서는 케이스 선별용이다.

## 공통 UI/UX

| ID | 우선순위 | 화면 | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| UI-001 | P1 | 전체 | 화면 폭이 줄어든 상태에서 주요 관리자/유저 화면을 연다 | 모바일 레이아웃으로 바뀌지 않고 기준 폭을 유지하며 오른쪽부터 잘리거나 축소된다 |
| UI-002 | P1 | 로그인 | 로그인 페이지 푸터를 확인한다 | 푸터는 항상 하단에 있고, 화면 폭 전체 배경을 채우며, 내용은 중앙 기준으로 정렬된다 |
| UI-003 | P1 | 액션 버튼 | 로그인/업로드/저장/요청 액션 중 로딩 상태를 확인한다 | double-bounce 로더가 표시되고 중복 클릭이 방지된다 |
| UI-004 | P2 | 전체 | 로딩/빈 상태/에러 상태가 필요한 화면을 확인한다 | 빈 데이터 또는 실패 상태에서 사용자용 메시지가 노출된다 |
| UI-005 | P1 | 검색 날짜 필터 | 날짜 필터가 있는 화면을 최초 진입한다 | 시작일은 오늘 기준 1개월 전, 종료일은 오늘로 기본 설정된다 |

## 인증

| ID | 우선순위 | 화면/API | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| AUTH-001 | P1 | `/admin/login` | 이메일/비밀번호가 비어 있는 상태 | 로그인 버튼은 비활성 상태다 |
| AUTH-002 | P1 | `/admin/login` | 이메일/비밀번호를 모두 입력한다 | 로그인 버튼 배경이 `#ff2b3a`로 바뀐다 |
| AUTH-003 | P1 | `/admin/login` | 로컬 환경에서 임의 이메일/비밀번호로 로그인한다 | 관리자 회원 목록 또는 관리자 기본 화면으로 이동한다 |
| AUTH-004 | P1 | `/admin/login` | 로그인 요청 중 상태를 확인한다 | 버튼 안에 로더와 `로그인 중` 텍스트가 표시된다 |
| AUTH-005 | P1 | `/login` | 로컬 환경에서 임의 이메일/비밀번호로 로그인한다 | 유저 대시보드로 이동한다 |
| AUTH-006 | P1 | 보호 화면 | 미로그인 상태로 `/admin/members`, `/admin/requests`, `/admin/sheets`, `/dashboard`, `/products/공룡`에 직접 접근한다 | 각 권한에 맞는 로그인 페이지로 리다이렉트된다 |

## 관리자 레이아웃/사이드바

| ID | 우선순위 | 화면 | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| ADMIN-LAYOUT-001 | P1 | 관리자 전체 | 사이드바 기본 정보를 확인한다 | 회사명, 이메일, 메뉴가 좌측 정렬로 표시된다 |
| ADMIN-LAYOUT-002 | P1 | `/admin/sheets` | 회원목록 메뉴가 비활성 상태일 때 아이콘 색을 확인한다 | 회원목록 아이콘은 검정 계열로 표시된다 |
| ADMIN-LAYOUT-003 | P1 | `/admin/members` | 회원목록 메뉴가 활성 상태일 때 확인한다 | 메뉴 배경은 연한 파랑, 텍스트/아이콘은 파랑으로 표시된다 |
| ADMIN-LAYOUT-004 | P2 | 시트 업로드 후 | 업로드된 시트가 있을 때 사이드바를 확인한다 | 시트명이 사이드바 하위 목록으로 표시되고 클릭하면 해당 시트 상세로 이동한다 |

## 관리자 회원 목록

| ID | 우선순위 | 화면 | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| ADMIN-MEMBER-001 | P1 | `/admin/members` | 회원 목록을 연다 | 가입 일자, 업체명, 담당자, 이메일, 연결 시트, 상세정보 컬럼이 표시된다 |
| ADMIN-MEMBER-002 | P1 | `/admin/members` | 업체명 검색어를 입력한다 | 업체명 기준으로 테이블 데이터가 필터링된다 |
| ADMIN-MEMBER-003 | P1 | `/admin/members` | 검색 날짜 시작/종료 값을 바꾼다 | 날짜 범위 기준으로 테이블 데이터가 필터링된다 |
| ADMIN-MEMBER-004 | P1 | `/admin/members` | 날짜 입력 버튼을 클릭한다 | 네이티브 날짜 선택기가 열린다 |
| ADMIN-MEMBER-005 | P1 | `/admin/members` | 연결 시트 컬럼을 확인한다 | 기존 URL 대신 시트명이 표시되고, 여러 개면 `외N` 형식이 붙는다 |
| ADMIN-MEMBER-006 | P1 | `/admin/members` | `신규 계정 생성하기` 버튼을 클릭한다 | `/admin/members/new`로 이동한다 |
| ADMIN-MEMBER-007 | P1 | `/admin/members` | 상세정보 `보기`를 클릭한다 | 선택한 회원 상세/수정 화면으로 이동한다 |

## 관리자 회원 생성/수정

| ID | 우선순위 | 화면 | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| ADMIN-MEMBER-FORM-001 | P1 | `/admin/members/new` | 페이지 기본 레이아웃을 확인한다 | 로고, `고객사 신규 계정생성`, 이메일/비밀번호/비밀번호 확인/업체명/담당자/구글시트 입력이 중앙 정렬로 표시된다 |
| ADMIN-MEMBER-FORM-002 | P1 | `/admin/members/new` | 필수 입력값을 하나라도 비운다 | 계정 생성 버튼은 비활성 상태다 |
| ADMIN-MEMBER-FORM-003 | P1 | `/admin/members/new` | 모든 필수 입력값과 시트를 선택한다 | 계정 생성 버튼이 활성화된다 |
| ADMIN-MEMBER-FORM-004 | P1 | `/admin/members/new` | 비밀번호 보기 아이콘을 클릭한다 | 비밀번호 입력값이 보이거나 다시 숨겨진다 |
| ADMIN-MEMBER-FORM-005 | P1 | `/admin/members/new` | 구글시트 입력을 클릭한다 | 텍스트 입력 가능 상태와 동시에 드롭다운이 열린다 |
| ADMIN-MEMBER-FORM-006 | P1 | `/admin/members/new` | 시트 검색어를 입력한다 | 선택 가능한 시트 목록이 검색어 기준으로 필터링된다 |
| ADMIN-MEMBER-FORM-007 | P1 | `/admin/members/new` | 선택 가능한 시트가 없는 상태에서 드롭다운을 연다 | `선택 가능한 시트가 없습니다.`가 드롭다운 중앙에 표시된다 |
| ADMIN-MEMBER-FORM-008 | P1 | `/admin/members/new` | 드롭다운에서 시트를 선택한다 | 선택한 시트가 태그 형태로 표시되고, 같은 시트는 목록에서 제외된다 |
| ADMIN-MEMBER-FORM-009 | P1 | `/admin/members/new` | 선택한 시트 삭제 아이콘을 클릭한다 | 시트 태그가 제거되고 다시 선택 가능해진다 |
| ADMIN-MEMBER-FORM-010 | P2 | `/admin/members/[memberId]` | 수정 화면을 연다 | 기존 이메일/비밀번호는 수정 화면 상태에 맞게 표시되고 수정/삭제 버튼이 보인다 |
| ADMIN-MEMBER-FORM-011 | P1 | `/api/admin/members` | 필수값과 시트를 선택한 뒤 계정 생성을 완료한다 | Supabase Auth 유저, 고객 DB, 고객 유저 DB가 생성되고 선택 시트/레코드가 해당 고객에게 매칭된다 |
| ADMIN-MEMBER-FORM-012 | P1 | `/api/admin/members` | 이미 등록된 이메일로 계정 생성을 요청한다 | `409 EMAIL_ALREADY_EXISTS`와 사용자용 에러 메시지가 반환된다 |
| ADMIN-MEMBER-FORM-013 | P1 | `/admin/members/[memberId]` | 업체명/담당자/시트를 수정하고 저장한다 | 수정 중 로더가 표시되고 저장 후 변경값이 유지된다 |
| ADMIN-MEMBER-FORM-014 | P1 | `/api/admin/members/[memberId]` | 회원 수정 시 연결 시트를 변경한다 | 기존 시트 연결은 해제되고 새로 선택한 시트와 레코드가 해당 고객에게 매칭된다 |

## 관리자 최근 요청

| ID | 우선순위 | 화면 | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| ADMIN-REQ-001 | P1 | `/admin/requests` | 최근 요청 목록을 연다 | 요청 일시, 요청자, 상품, 침해 제품명, 플랫폼, 상태, 상세정보 컬럼이 표시된다 |
| ADMIN-REQ-002 | P1 | `/admin/requests` | 요청 데이터가 없거나 DB 조회 실패 시 화면을 연다 | 상세 확인 가능한 데모 요청 1건이 표시된다 |
| ADMIN-REQ-003 | P1 | `/admin/requests` | 요청 일시를 확인한다 | `26. 05. 13.`처럼 날짜만 표시되고 시간은 표시되지 않는다 |
| ADMIN-REQ-004 | P1 | `/admin/requests` | 필터 select에서 날짜순 최신/오래된/플랫폼순/유저순/이름순/상태순을 선택한다 | 선택한 기준으로 목록 순서가 변경된다 |
| ADMIN-REQ-005 | P1 | `/admin/requests` | 상세정보 `보기`를 클릭한다 | `/admin/requests/[requestId]` 상세 화면으로 이동한다 |
| ADMIN-REQ-006 | P1 | `/admin/requests/demo-request-1` | 데모 요청 상세 화면을 연다 | 상세 카드가 관리자 콘텐츠 영역 중앙에 표시된다 |
| ADMIN-REQ-007 | P2 | `/admin/requests/[requestId]` | 상세 화면 정보를 확인한다 | 요청 정보, 침해 상품 정보, 링크/상태 정보가 안전하게 표시된다 |

## 관리자 시트 업로드/시트별 목록

| ID | 우선순위 | 화면/API | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| ADMIN-SHEET-001 | P1 | `/admin/sheets` | 시트 업로드 화면을 연다 | 시트명 입력, 파일 선택, 업로드 버튼, 업로드된 시트 테이블이 표시된다 |
| ADMIN-SHEET-002 | P1 | `/admin/sheets` | 파일 선택 UI를 확인한다 | lucide 업로드 아이콘과 `파일 선택` 텍스트가 중앙 정렬로 표시된다 |
| ADMIN-SHEET-003 | P1 | `/admin/sheets` | 파일 선택 영역을 클릭한다 | 네이티브 파일 선택 창이 열린다 |
| ADMIN-SHEET-004 | P1 | `/admin/sheets` | 파일을 선택한다 | 선택한 파일명이 파일 선택 영역에 표시되고 업로드 버튼이 활성화된다 |
| ADMIN-SHEET-005 | P1 | `/admin/sheets` | 업로드 버튼을 클릭한다 | 업로드 중 로더가 표시되고 중복 제출이 방지된다 |
| ADMIN-SHEET-006 | P1 | `/api/admin/sheets/upload` | CSV/XLSX 파일을 업로드한다 | 시트 데이터가 DB에 저장되고 업로드된 시트 상세로 이동한다 |
| ADMIN-SHEET-007 | P1 | `/api/admin/sheets/upload` | 파싱 가능한 데이터가 없는 파일을 업로드한다 | 버튼 레이아웃이 밀리지 않고 안전한 에러 메시지가 표시된다 |
| ADMIN-SHEET-008 | P2 | `/admin/sheets` | 업로드된 시트 목록을 확인한다 | 시트명, 원본 파일, 데이터 수, 상세정보가 표시된다 |
| ADMIN-SHEET-009 | P1 | `/admin/sheets/[sheetId]` | 시트 상세를 연다 | 유저 내역목록과 같은 테이블 UI로 시트 레코드가 표시된다 |
| ADMIN-SHEET-010 | P1 | `/admin/sheets/[sheetId]` | 필터/검색 날짜를 변경하고 새로고침한다 | 선택한 조건에 맞게 시트 레코드가 정렬/필터링된다 |
| ADMIN-SHEET-011 | P1 | `/admin/sheets` | 매칭되지 않은 시트의 삭제하기를 클릭한다 | 확인 후 시트와 시트 레코드가 hard delete되고 목록에서 사라진다 |
| ADMIN-SHEET-012 | P1 | `/admin/sheets` | 고객에게 매칭된 시트의 삭제하기를 클릭한다 | 해당 고객명 또는 이메일이 포함된 팝업이 표시되고 삭제되지 않는다 |
| ADMIN-SHEET-013 | P1 | `/api/admin/sheets/[sheetId]` | 고객에게 매칭된 시트를 DELETE로 직접 요청한다 | `409 SHEET_ASSIGNED_TO_CUSTOMER` 응답으로 삭제가 차단된다 |
| ADMIN-SHEET-014 | P1 | `/admin/sheets/[sheetId]` | 행 추가를 열고 필수 제품명과 선택 정보를 입력한 뒤 저장한다 | 새 시트 행이 DB에 저장되고 현재 시트 목록에 즉시 추가된다 |

## 유저 대시보드

| ID | 우선순위 | 화면 | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| USER-DASH-001 | P1 | `/dashboard` | 대시보드를 연다 | 총 검색 수, 확정된 위조품 수, 차단 신청 수, 차단 완료 수 카드가 표시된다 |
| USER-DASH-002 | P1 | `/dashboard` | 조회 상품을 바꾼 뒤 조회한다 | 상품 기준으로 카드/차트/테이블 데이터가 변경된다 |
| USER-DASH-003 | P1 | `/dashboard` | 검색 날짜 범위를 바꾼 뒤 조회한다 | 기간 기준으로 대시보드 데이터가 변경된다 |
| USER-DASH-004 | P1 | `/dashboard` | 도넛 차트 영역을 확인한다 | 차트 내부 퍼센트가 다른 영역을 침범하지 않고, 플랫폼별 퍼센트는 범례에 표시된다 |
| USER-DASH-005 | P1 | `/dashboard` | 월별 위조품 현황 그리드를 확인한다 | 월별 차트 배경 그리드가 Figma 기준처럼 촘촘한 라인으로 표시된다 |
| USER-DASH-006 | P2 | `/dashboard` | 연도 선택 값을 변경한다 | 해당 연도 월별 그래프가 갱신된다 |

## 유저 내역목록/차단 요청

| ID | 우선순위 | 화면/API | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| USER-HISTORY-001 | P1 | `/products/공룡` | 내역목록을 연다 | 순번, 진행 상황, 검색 날짜, 이미지, 플랫폼, 제품명, 업체명, 가격, 판매수량, 링크, 차단 신청, 상세정보가 표시된다 |
| USER-HISTORY-002 | P1 | `/products/공룡` | 필터 select 값을 변경한다 | 판매가/판매수량/플랫폼 기준으로 목록이 정렬된다 |
| USER-HISTORY-003 | P1 | `/products/공룡` | 검색 날짜 범위를 바꾼 뒤 새로고침한다 | 날짜 범위에 맞게 목록이 필터링되고 페이지가 1로 이동한다 |
| USER-HISTORY-004 | P1 | `/products/공룡` | 차단 신청 체크박스를 클릭한다 | 요청 저장 중 로더가 체크박스 위치에 표시되고 중복 요청이 방지된다 |
| USER-HISTORY-005 | P1 | `/api/user/requests` | 차단 신청 API가 성공한다 | 요청 상태가 유지되고 관리자 최근 요청에 해당 요청이 표시된다 |
| USER-HISTORY-006 | P1 | `/api/user/requests` | 차단 신청 API가 실패한다 | 체크박스 상태가 원복되고 사용자용 에러 메시지가 표시된다 |
| USER-HISTORY-007 | P2 | `/products/공룡` | 페이지네이션 버튼을 클릭한다 | 선택한 페이지 데이터가 표시된다 |
| USER-HISTORY-008 | P2 | `/products/공룡/[itemId]` | 상세정보 `보기`를 클릭한다 | 상품 상세 화면으로 이동하고 이미지/기본 정보/외부 링크/상태가 표시된다 |

## 디자인 피드백 도구

| ID | 우선순위 | 화면/API | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| FEEDBACK-001 | P1 | local/dev 전체 | 로컬 화면을 연다 | 우측 하단에 `디자인 피드백` CTA가 표시된다 |
| FEEDBACK-002 | P1 | local/dev 전체 | `디자인 피드백`을 클릭하고 요소 위에 마우스를 올린다 | 검사 도구처럼 선택 대상 레이아웃 하이라이트가 표시된다 |
| FEEDBACK-003 | P1 | local/dev 전체 | 요소를 클릭한다 | 선택 요소 selector, 크기, 좌표와 코멘트 입력 패널이 표시된다 |
| FEEDBACK-004 | P1 | `/api/dev/design-feedback` | 코멘트를 입력하고 저장한다 | 저장 중 로더가 표시되고 `docs/design-feedback/*.md` 파일이 생성된다 |
| FEEDBACK-005 | P1 | local/dev 전체 | 적용 완료된 피드백 문서를 정리한다 | 적용된 파일은 `docs/design-feedback/deprecated/`로 이동하고 inbox에는 새 피드백만 남는다 |
| FEEDBACK-006 | P1 | production build | 프로덕션 모드 화면을 연다 | 디자인 피드백 CTA와 저장 API는 사용할 수 없다 |

## API/권한/보안

| ID | 우선순위 | 화면/API | 케이스 | 기대 결과 |
| --- | --- | --- | --- | --- |
| API-001 | P1 | `/api/admin/auth/login` | 잘못된 요청 body를 보낸다 | Zod validation 실패 응답이 공통 포맷으로 반환된다 |
| API-002 | P1 | `/api/user/auth/login` | 잘못된 요청 body를 보낸다 | Zod validation 실패 응답이 공통 포맷으로 반환된다 |
| API-003 | P1 | `/api/admin/sheets/upload` | 미인증 상태로 업로드를 요청한다 | 401 응답과 사용자용 메시지가 반환된다 |
| API-004 | P1 | `/api/user/requests` | 미인증 상태로 차단 요청을 보낸다 | 401 응답과 사용자용 메시지가 반환된다 |
| API-005 | P1 | 공통 API | 실패 응답을 확인한다 | API key, 토큰, DB 연결 정보 등 내부 정보가 응답에 노출되지 않는다 |

## 후순위/구현 이후 확정 필요

| ID | 우선순위 | 케이스 | 비고 |
| --- | --- | --- | --- |
| FUTURE-001 | P1 | 회원 hard delete 및 연결 데이터 삭제 | 삭제 API/확인 모달 구현 후 테스트 코드 작성 |
| FUTURE-002 | P1 | 최근 요청 삭제 | 삭제 API/확인 모달 구현 후 테스트 코드 작성 |
| FUTURE-003 | P1 | 외부 API timeout/malformed response 처리 | 외부 API 연동 방식 확정 후 mock 전략 필요 |
| FUTURE-004 | P2 | Supabase 실제 RLS/권한 회귀 테스트 | 운영 스키마/RLS 확정 후 별도 테스트 필요 |
