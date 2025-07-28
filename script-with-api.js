// 서버 API를 사용하는 버전
const API_BASE_URL = 'http://localhost:3001/api'; // 개발 환경
// const API_BASE_URL = 'https://your-server.com/api'; // 프로덕션 환경

let selectedSongs = {
    song1: null,
    song2: null
};

let interpretSelectedSong = null;

// 서버를 통한 Spotify 검색
async function searchSpotify(query) {
    console.log('Searching Spotify for:', query);
    
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            console.error('API error:', response.status, response.statusText);
            return [];
        }
        
        const tracks = await response.json();
        console.log('Spotify search results:', tracks.length, 'tracks found');
        return tracks;
    } catch (error) {
        console.error('Spotify 검색 오류:', error);
        return [];
    }
}

// 서버를 통한 아티스트 정보 가져오기
async function getArtistInfo(artistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/artist/${artistId}`);
        
        if (!response.ok) {
            throw new Error(`Artist API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Artist info error:', error);
        throw error;
    }
}

// 서버를 통한 YouTube 검색
async function searchYouTube(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/youtube/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`YouTube search error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('YouTube search error:', error);
        throw error;
    }
}

// 서버를 통한 YouTube 비디오 통계
async function getYouTubeStats(videoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/youtube/stats/${videoId}`);
        
        if (!response.ok) {
            throw new Error(`YouTube stats error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('YouTube stats error:', error);
        throw error;
    }
}

// YouTube 조회수 가져오기 (개선된 버전)
async function getYouTubeViews(songTitle, artistName) {
    try {
        const searchQueries = [
            `${artistName} ${songTitle} official video`,
            `${artistName} ${songTitle} official`,
            `${artistName} ${songTitle}`,
            `${songTitle} ${artistName}`
        ];
        
        for (const query of searchQueries) {
            console.log('Searching YouTube with query:', query);
            const searchData = await searchYouTube(query);
            
            if (searchData.items && searchData.items.length > 0) {
                for (const item of searchData.items) {
                    const title = item.snippet.title.toLowerCase();
                    const channelTitle = item.snippet.channelTitle.toLowerCase();
                    
                    if (title.includes(songTitle.toLowerCase()) || 
                        channelTitle.includes(artistName.toLowerCase()) ||
                        channelTitle.includes('vevo')) {
                        
                        const videoId = item.id.videoId;
                        const statsData = await getYouTubeStats(videoId);
                        
                        if (statsData.items && statsData.items.length > 0) {
                            const viewCount = parseInt(statsData.items[0].statistics.viewCount) || 0;
                            console.log(`YouTube views for "${songTitle}": ${viewCount}`);
                            return viewCount;
                        }
                    }
                }
            }
        }
        
        console.log('No YouTube videos found for:', songTitle, 'by', artistName);
        return 0;
    } catch (error) {
        console.error('YouTube API 오류:', error);
        return 0;
    }
}

// 곡 데이터 수집 (개선된 버전)
async function collectSongData(track) {
    try {
        // 아티스트 정보 가져오기
        const artistData = await getArtistInfo(track.artists[0].id);
        
        // YouTube 뮤직비디오 조회수 가져오기
        const youtubeViews = await getYouTubeViews(track.name, track.artists[0].name);
        
        // YouTube 채널 구독자 수는 복잡하므로 일단 0으로 설정
        const youtubeSubscribers = 0;
        
        return {
            // 곡 데이터
            spotifyPopularity: track.popularity,
            youtubeViews: youtubeViews,
            
            // 아티스트 데이터
            artistPopularity: artistData.popularity || 0,
            artistFollowers: artistData.followers?.total || 0,
            youtubeSubscribers: youtubeSubscribers,
            
            // 기타 정보
            trackName: track.name,
            artistName: track.artists[0].name
        };
    } catch (error) {
        console.error('Data collection error:', error);
        throw error;
    }
}

// 나머지 함수들은 기존과 동일...
// (자동완성, UI 처리 등의 함수들을 여기에 복사)