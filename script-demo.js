// 데모 모드 스크립트 (API 오류 시 사용)
const DEMO_MODE = true;

let selectedSongs = {
    song1: null,
    song2: null
};

let interpretSelectedSong = null;

// 데모용 검색 결과
const DEMO_TRACKS = {
    'blinding lights': [{
        id: 'demo1',
        name: 'Blinding Lights',
        artists: [{ id: 'weeknd', name: 'The Weeknd' }],
        album: { 
            images: [{ url: 'https://via.placeholder.com/300x300/1ed760/000000?text=Blinding+Lights' }], 
            name: 'After Hours' 
        },
        popularity: 100
    }],
    'runaway': [{
        id: 'demo2',
        name: 'Runaway',
        artists: [{ id: 'kanye', name: 'Kanye West' }],
        album: { 
            images: [{ url: 'https://via.placeholder.com/300x300/1ed760/000000?text=Runaway' }], 
            name: 'My Beautiful Dark Twisted Fantasy' 
        },
        popularity: 95
    }],
    'lose yourself': [{
        id: 'demo3',
        name: 'Lose Yourself',
        artists: [{ id: 'eminem', name: 'Eminem' }],
        album: { 
            images: [{ url: 'https://via.placeholder.com/300x300/1ed760/000000?text=Lose+Yourself' }], 
            name: '8 Mile' 
        },
        popularity: 98
    }],
    'shape of you': [{
        id: 'demo4',
        name: 'Shape of You',
        artists: [{ id: 'ed', name: 'Ed Sheeran' }],
        album: { 
            images: [{ url: 'https://via.placeholder.com/300x300/1ed760/000000?text=Shape+of+You' }], 
            name: '÷ (Divide)' 
        },
        popularity: 99
    }],
    'bad guy': [{
        id: 'demo5',
        name: 'bad guy',
        artists: [{ id: 'billie', name: 'Billie Eilish' }],
        album: { 
            images: [{ url: 'https://via.placeholder.com/300x300/1ed760/000000?text=bad+guy' }], 
            name: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?' 
        },
        popularity: 97
    }]
};

// 데모 검색 함수
async function searchSpotify(query) {
    console.log('Demo mode: searching for', query);
    const searchKey = query.toLowerCase();
    
    // 데모 데이터에서 검색
    for (const [key, tracks] of Object.entries(DEMO_TRACKS)) {
        if (key.includes(searchKey) || searchKey.includes(key)) {
            return tracks;
        }
    }
    
    // 찾지 못하면 모든 데모 트랙 반환
    return Object.values(DEMO_TRACKS).flat();
}

// 데모 데이터 수집
async function collectSongData(track) {
    return {
        spotifyPopularity: track.popularity,
        youtubeViews: Math.floor(Math.random() * 900000000) + 100000000, // 1억-10억 랜덤
        artistPopularity: Math.floor(Math.random() * 30) + 70, // 70-100 랜덤
        artistFollowers: Math.floor(Math.random() * 9000000) + 1000000, // 100만-1000만 랜덤
        youtubeSubscribers: Math.floor(Math.random() * 9000000) + 1000000,
        awardsInfo: { grammy: '정보 없음', other: '정보 없음' },
        trackName: track.name,
        artistName: track.artists[0].name
    };
}

// 나머지 UI 함수들은 script-realtime.js에서 복사...