# BookTidy

BookTidy는 Firefox Desktop용 WebExtensions Manifest V3 확장 프로그램입니다. 사용자가 등록한 출판사 또는 저자 규칙에 맞는 교보문고 검색 결과 도서 항목을 접어서 표시합니다.

## MVP 범위

- 대상 브라우저: Firefox Desktop 127 이상.
- 지원 사이트: `kyobobook.co.kr`.
- 규칙 타입: `publisher`, `author`.
- 매칭 방식: `contains`.
- 표시 방식: 원본 도서 항목을 숨기고 사유와 `보기` 버튼이 있는 collapsed UI를 표시합니다.
- 저장소: `browser.storage.local` 로컬 저장만 사용.
- 제외 범위: Chrome/Edge/Safari, Firefox for Android, Sync, options page, import/export, regex/exact matching, popup 변경의 실시간 content-script 메시징, 실제 온라인 사이트 네트워크 E2E, 서버 연동, analytics.

## 동작

1. popup에서 BookTidy 활성화 여부를 설정합니다.
2. popup에서 light/dark 테마를 선택합니다.
3. popup에서 `출판사` 또는 `저자` 규칙을 추가합니다.
4. 교보문고 검색 결과 페이지를 새로고침합니다. popup의 `현재 페이지 새로고침` 버튼을 사용할 수도 있습니다.
5. content script가 도서 항목의 제목, 출판사, 저자 정보를 읽고 `contains` 규칙을 평가합니다.
6. 매칭된 항목은 `BookTidy에 의해 접힘`, `사유: ...`, `보기` 버튼을 가진 collapsed UI로 대체됩니다.
7. `보기`를 누르면 해당 원본 항목만 임시로 다시 표시됩니다.

popup 변경 사항은 현재 열린 검색 결과 페이지에 즉시 메시징하지 않습니다. 적용 기준은 페이지 새로고침입니다.

교보문고 어댑터는 검색 결과 DOM을 우선 읽고, 필요한 경우 페이지의 JSON-LD 구조화 데이터 또는 카드 메타데이터를 보조 정보로 사용합니다. 동적으로 추가되는 검색 결과는 `MutationObserver`로 감지해 다시 평가합니다.

## 저장 데이터

BookTidy는 다음 값만 `browser.storage.local`에 저장합니다.

- 사용자가 입력한 출판사 필터와 해당 규칙의 내부 메타데이터.
- 사용자가 입력한 저자 필터와 해당 규칙의 내부 메타데이터.
- BookTidy 활성화 여부.
- popup 테마 설정(`light` 또는 `dark`).
- storage schema version.

규칙 메타데이터는 규칙 식별자, 규칙 활성화 여부, 매칭 방식, 생성 시각, 수정 시각을 포함합니다.
외부 서버 전송은 없습니다.

## 권한

- `storage`: 필터 규칙과 설정을 Firefox 로컬 확장 저장소에 저장하고 불러옵니다.
- `tabs`: popup의 `현재 페이지 새로고침` 버튼에서 현재 활성 탭을 찾고 새로고침합니다.
- `*://*.kyobobook.co.kr/*`: 교보문고 페이지에서 도서 항목 정보를 읽고 로컬 규칙과 비교합니다.
- `booktidy-icon.svg` web-accessible resource: 교보문고 페이지에 표시되는 BookTidy collapsed UI에서 확장 아이콘을 불러옵니다.

## 개발 명령

```bash
pnpm dev
pnpm clean
pnpm build
pnpm test
pnpm test:run
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:all
pnpm lint
pnpm format
pnpm check
pnpm web-ext:run
pnpm web-ext:lint
pnpm web-ext:build
pnpm package
```

`pnpm package`는 기존 `dist`와 `web-ext-artifacts`를 지운 뒤 빌드하고 `web-ext` 패키지를 생성합니다.

## 테스트

```bash
pnpm build
pnpm test:run
pnpm test:e2e
pnpm lint
pnpm web-ext:lint
pnpm web-ext:build
```

Playwright E2E는 빌드된 `dist/assets/content.js`와 `dist/assets/content.css`를 정적 fixture에 주입합니다. 따라서 `pnpm test:e2e` 전에 `pnpm build`를 먼저 실행해야 합니다.

테스트 범위는 storage schema 정규화, rule matcher/engine, Kyobo adapter, collapsed renderer, mutation observer, extension build 산출물과 `web-ext` validation을 포함합니다.

## Firefox에서 실행

```bash
pnpm build
pnpm web-ext:run
```

Firefox가 열리면 교보문고 검색 결과 페이지에서 popup을 열고 publisher/author 규칙을 추가한 뒤 페이지를 새로고침합니다.

`web-ext:run`의 기본 시작 URL은 `https://store.kyobobook.co.kr/category/domestic/3301/all`입니다.

## 문서

- [CHANGELOG.md](CHANGELOG.md): 릴리스 변경 사항.
- [PRIVACY.md](PRIVACY.md): 저장 데이터, 수집하지 않는 데이터, 권한 사용 목적.

## 독립 구현 원칙

BookTidy는 TypeScript 기반 신규 구현입니다. 외부 확장 프로그램의 소스 코드, README 문구, 아이콘, 이미지, 스크린샷, CSS class, DOM 처리 로직, UI 문구를 복사하지 않습니다.
