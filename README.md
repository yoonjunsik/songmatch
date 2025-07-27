# 🎧 SongMatch - 명곡 비교 분석기

두 곡을 비교해서 어떤 곡이 더 명곡인지 객관적인 데이터로 평가하는 웹 애플리케이션입니다.

## 주요 기능

- 🔍 **실시간 곡 검색**: Spotify API를 통한 자동완성 검색
- 📊 **객관적 평가**: 스트리밍 수, YouTube 조회수, 아티스트 영향력 등 다양한 지표 활용
- 📈 **시각적 비교**: Chart.js를 활용한 점수 시각화
- 📱 **반응형 디자인**: 모바일에서도 완벽하게 작동

## 평가 기준 (100점 만점)

1. **Spotify 스트리밍 수** (25점)
   - 누적 재생 수 기반 점수 산정

2. **YouTube 조회수** (25점)
   - 공식 뮤직비디오 조회수 기반

3. **아티스트 영향력** (20점)
   - Spotify 팔로워 수 기반

4. **차트 성적** (20점) - 추후 구현 예정
5. **비평가 평점** (10점) - 추후 구현 예정

## 시작하기

### 1. API 키 발급

1. **Spotify API**
   - [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)에서 앱 생성
   - Client ID와 Client Secret 발급

2. **YouTube Data API v3**
   - [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트 생성
   - YouTube Data API v3 활성화 후 API 키 발급

### 2. 설정

1. `.env.example` 파일을 복사하여 `.env` 파일 생성
2. 발급받은 API 키 입력:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
```

3. `script.js` 파일 상단의 API 설정 부분에 키 입력:
```javascript
const SPOTIFY_CLIENT_ID = 'your_spotify_client_id';
const SPOTIFY_CLIENT_SECRET = 'your_spotify_client_secret';
const YOUTUBE_API_KEY = 'your_youtube_api_key';
```

### 3. 실행

1. 웹 서버 실행 (예: Live Server, Python SimpleHTTPServer 등)
2. 브라우저에서 `index.html` 열기

## 사용 방법

1. 첫 번째 검색창에 비교하고 싶은 곡 입력
2. 자동완성 목록에서 곡 선택
3. 두 번째 검색창에 비교할 곡 입력 및 선택
4. "비교하기" 버튼 클릭
5. 결과 확인!

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **API**: Spotify Web API, YouTube Data API v3
- **차트**: Chart.js
- **스타일**: 커스텀 CSS (다크 테마)

## 향후 개선 사항

- Billboard 차트 데이터 연동
- 음악 비평 사이트 평점 추가
- 사용자 투표 기능
- 곡 3개 이상 동시 비교
- 장르별/시대별 필터링

## 라이선스

이 프로젝트는 개인 학습 및 비상업적 용도로만 사용 가능합니다.