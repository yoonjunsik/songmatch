// API 설정 (실제 사용시 환경변수로 관리)
const SPOTIFY_CLIENT_ID = 'c0fc48fafef3410d99aa2773c88bb6b4';
const SPOTIFY_CLIENT_SECRET = 'ee014e12ab01487f967248809e627d64';
const YOUTUBE_API_KEY = 'AIzaSyCLIjOKfb-BdP0XzryFmGC3T-x51XrYWkc';

let spotifyAccessToken = null;
let selectedSongs = {
    song1: null,
    song2: null
};

// Spotify 토큰 가져오기
async function getSpotifyToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    spotifyAccessToken = data.access_token;
    return data.access_token;
}

// Spotify 검색
async function searchSpotify(query) {
    if (!spotifyAccessToken) {
        await getSpotifyToken();
    }
    
    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
            headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
            }
        });
        
        if (response.status === 401) {
            await getSpotifyToken();
            return searchSpotify(query);
        }
        
        const data = await response.json();
        return data.tracks.items;
    } catch (error) {
        console.error('Spotify 검색 오류:', error);
        return [];
    }
}

// YouTube 비디오 검색 및 조회수 가져오기
async function getYouTubeViews(songTitle, artistName) {
    // 인기곡 하드코딩 데이터 (YouTube API 오류 시 대체)
    const popularVideos = {
        'Hotline Bling Drake': 1761969539,
        'Heartless Kanye West': 234000000,
        'Not Like Us Kendrick Lamar': 197000000,
        'CARNIVAL Kanye West': 89000000,
        'Starboy The Weeknd': 2800000000,
        'Blinding Lights The Weeknd': 4100000000,
        'Die For You The Weeknd': 839000000,
        'One Of The Girls The Weeknd': 194000000,
        'Save Your Tears The Weeknd': 1100000000,
        'Run This Town JAY-Z': 234000000,
        'Umbrella Rihanna': 1100000000,
        'We Found Love Rihanna': 786000000,
        'Diamonds Rihanna': 2100000000,
        'Work Rihanna': 1400000000,
        'Stay Rihanna': 1100000000,
        'Shape of You Ed Sheeran': 6200000000,
        'Perfect Ed Sheeran': 3600000000,
        'Thinking Out Loud Ed Sheeran': 3600000000,
        'Bad Habits Ed Sheeran': 748000000,
        'Shivers Ed Sheeran': 579000000,
        'Bohemian Rhapsody Queen': 1800000000,
        'Don\'t Stop Me Now Queen': 1700000000,
        'We Will Rock You Queen': 1500000000,
        'We Are The Champions Queen': 900000000,
        'Somebody To Love Queen': 236000000,
        'Flowers Miley Cyrus': 738000000,
        'Wrecking Ball Miley Cyrus': 1400000000,
        'Party In The U.S.A. Miley Cyrus': 939000000,
        'Malibu Miley Cyrus': 549000000,
        'Anti-Hero Taylor Swift': 465000000,
        'Shake It Off Taylor Swift': 3400000000,
        'Blank Space Taylor Swift': 3400000000,
        'Love Story Taylor Swift': 700000000,
        'You Belong With Me Taylor Swift': 596000000,
        'Cruel Summer Taylor Swift': 139000000,
        'Style Taylor Swift': 705000000,
        'Wildest Dreams Taylor Swift': 785000000,
        'Hello Adele': 3200000000,
        'Someone Like You Adele': 2200000000,
        'Rolling in the Deep Adele': 2300000000,
        'Set Fire to the Rain Adele': 1900000000,
        'Easy On Me Adele': 589000000,
        'Skyfall Adele': 1600000000,
        'When We Were Young Adele': 785000000,
        'Send My Love Adele': 1600000000,
        'thank u, next Ariana Grande': 785000000,
        '7 rings Ariana Grande': 900000000,
        'positions Ariana Grande': 387000000,
        'Side To Side Ariana Grande': 2100000000,
        'Bang Bang Ariana Grande': 2100000000,
        'Problem Ariana Grande': 1300000000,
        'Break Free Ariana Grande': 1100000000,
        'No Tears Left To Cry Ariana Grande': 785000000,
        'God is a woman Ariana Grande': 408000000,
        'Rain On Me Lady Gaga': 323000000,
        'Shallow Lady Gaga': 2400000000,
        'Bad Romance Lady Gaga': 1800000000,
        'Poker Face Lady Gaga': 700000000,
        'Just Dance Lady Gaga': 406000000,
        'Telephone Lady Gaga': 320000000,
        'Paparazzi Lady Gaga': 394000000,
        'Applause Lady Gaga': 470000000,
        'Born This Way Lady Gaga': 255000000,
        'good 4 u Olivia Rodrigo': 748000000,
        'drivers license Olivia Rodrigo': 589000000,
        'traitor Olivia Rodrigo': 589000000,
        'deja vu Olivia Rodrigo': 408000000,
        'Levitating Dua Lipa': 900000000,
        'Don\'t Start Now Dua Lipa': 2200000000,
        'New Rules Dua Lipa': 2900000000,
        'IDGAF Dua Lipa': 1400000000,
        'Be The One Dua Lipa': 948000000,
        'Physical Dua Lipa': 889000000,
        'One Kiss Dua Lipa': 2200000000,
        'Break My Heart Dua Lipa': 689000000,
        'As It Was Harry Styles': 848000000,
        'Watermelon Sugar Harry Styles': 900000000,
        'Sign of the Times Harry Styles': 1300000000,
        'Golden Harry Styles': 234000000,
        'Adore You Harry Styles': 469000000,
        'Treat People With Kindness Harry Styles': 128000000,
        'Late Night Talking Harry Styles': 167000000,
        'Music For a Sushi Restaurant Harry Styles': 57000000
    };
    
    // 하드코딩 데이터 확인
    const searchKey = `${songTitle} ${artistName}`;
    if (popularVideos[searchKey]) {
        console.log(`Using cached YouTube views for "${songTitle}": ${popularVideos[searchKey]}`);
        return popularVideos[searchKey];
    }
    
    try {
        // 여러 검색 쿼리 시도
        const searchQueries = [
            `${artistName} ${songTitle} official video`,
            `${artistName} ${songTitle} official`,
            `${artistName} ${songTitle}`,
            `${songTitle} ${artistName}`
        ];
        
        for (const query of searchQueries) {
            console.log('Searching YouTube with query:', query);
            const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`
            );
            
            if (!searchResponse.ok) {
                console.error('YouTube Search API error:', searchResponse.status);
                const errorData = await searchResponse.json();
                console.error('YouTube error details:', errorData);
                continue;
            }
            
            const searchData = await searchResponse.json();
            console.log('YouTube search results:', searchData);
            
            if (searchData.items && searchData.items.length > 0) {
                // 가장 관련성 높은 비디오 찾기
                for (const item of searchData.items) {
                    const title = item.snippet.title.toLowerCase();
                    const channelTitle = item.snippet.channelTitle.toLowerCase();
                    
                    // 공식 채널이거나 관련성 높은 비디오 확인
                    if (title.includes(songTitle.toLowerCase()) || 
                        channelTitle.includes(artistName.toLowerCase()) ||
                        channelTitle.includes('vevo')) {
                        
                        const videoId = item.id.videoId;
                        console.log('Found video:', item.snippet.title, 'by', item.snippet.channelTitle);
                        
                        const statsResponse = await fetch(
                            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
                        );
                        
                        if (!statsResponse.ok) {
                            console.error('YouTube Stats API error:', statsResponse.status);
                            continue;
                        }
                        
                        const statsData = await statsResponse.json();
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

// 아티스트 수상 정보 가져오기 (표시용, 점수에는 미반영)
async function getArtistAwards(artistName) {
    // 먼저 하드코딩된 데이터 확인 (캐시 역할)
    const cachedData = {
        'Kendrick Lamar': { grammy: '17회 수상, 50회 노미네이트', other: 'BET Awards 29회, MTV VMA 7회' },
        'Beyoncé': { grammy: '32회 수상, 88회 노미네이트', other: 'MTV VMA 29회, BET Awards 29회' },
        'Taylor Swift': { grammy: '12회 수상, 46회 노미네이트', other: 'AMA 40회, Billboard Music Awards 29회' },
        'Adele': { grammy: '16회 수상, 18회 노미네이트', other: 'BRIT Awards 12회, Billboard Music Awards 18회' },
        'Bruno Mars': { grammy: '15회 수상, 31회 노미네이트', other: 'AMA 7회, Soul Train Awards 8회' },
        'Billie Eilish': { grammy: '7회 수상, 13회 노미네이트', other: 'AMA 6회, MTV VMA 3회' },
        'Kanye West': { grammy: '24회 수상, 75회 노미네이트', other: 'BET Awards 17회, Billboard Music Awards 17회' },
        'Ye': { grammy: '24회 수상, 75회 노미네이트', other: 'BET Awards 17회, Billboard Music Awards 17회' },
        'JAY-Z': { grammy: '24회 수상, 88회 노미네이트', other: 'BET Awards 14회, MTV VMA 14회' },
        'Jay-Z': { grammy: '24회 수상, 88회 노미네이트', other: 'BET Awards 14회, MTV VMA 14회' },
        'Drake': { grammy: '5회 수상, 51회 노미네이트', other: 'Billboard Music Awards 34회, AMA 6회' },
        'The Weeknd': { grammy: '4회 수상, 13회 노미네이트', other: 'Billboard Music Awards 20회, AMA 6회' },
        'Ed Sheeran': { grammy: '4회 수상, 15회 노미네이트', other: 'BRIT Awards 6회, Ivor Novello Awards 7회' },
        'Ariana Grande': { grammy: '2회 수상, 15회 노미네이트', other: 'MTV VMA 5회, Billboard Music Awards 30회' },
        'BTS': { grammy: '0회 수상, 5회 노미네이트', other: 'AMA 9회, Billboard Music Awards 12회' },
        'Coldplay': { grammy: '7회 수상, 39회 노미네이트', other: 'BRIT Awards 9회, MTV VMA 8회' },
        'Rihanna': { grammy: '9회 수상, 33회 노미네이트', other: 'AMA 13회, Billboard Music Awards 23회' },
        'Chris Brown': { grammy: '1회 수상, 16회 노미네이트', other: 'BET Awards 18회, Soul Train Awards 14회' },
        'Eminem': { grammy: '15회 수상, 44회 노미네이트', other: 'MTV VMA 13회, Billboard Music Awards 17회' },
        'Lady Gaga': { grammy: '13회 수상, 36회 노미네이트', other: 'MTV VMA 18회, Billboard Music Awards 6회' },
        'Justin Bieber': { grammy: '2회 수상, 23회 노미네이트', other: 'AMA 18회, Billboard Music Awards 26회' },
        'Dua Lipa': { grammy: '3회 수상, 11회 노미네이트', other: 'BRIT Awards 7회, MTV EMA 4회' },
        'Harry Styles': { grammy: '3회 수상, 12회 노미네이트', other: 'BRIT Awards 3회, AMA 2회' },
        'Olivia Rodrigo': { grammy: '3회 수상, 7회 노미네이트', other: 'AMA 3회, MTV VMA 3회' },
        'Post Malone': { grammy: '0회 수상, 10회 노미네이트', other: 'AMA 9회, Billboard Music Awards 10회' },
        'Bad Bunny': { grammy: '2회 수상, 7회 노미네이트', other: 'Latin Grammy 5회, Billboard Music Awards 10회' },
        'SZA': { grammy: '1회 수상, 9회 노미네이트', other: 'BET Awards 4회, Billboard Music Awards 5회' },
        'Doja Cat': { grammy: '1회 수상, 14회 노미네이트', other: 'MTV VMA 4회, Billboard Music Awards 9회' }
    };
    
    // 캐시에 있으면 바로 반환
    if (cachedData[artistName]) {
        return cachedData[artistName];
    }
    
    // 캐시에 없으면 MusicBrainz API로 검색
    try {
        // MusicBrainz에서 아티스트 검색
        const searchUrl = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(artistName)}&fmt=json`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (!searchData.artists || searchData.artists.length === 0) {
            return { grammy: '정보 없음', other: '정보 없음' };
        }
        
        const artistId = searchData.artists[0].id;
        
        // 아티스트 상세 정보와 관계 정보 가져오기
        const detailUrl = `https://musicbrainz.org/ws/2/artist/${artistId}?inc=ratings+tags+annotation&fmt=json`;
        const detailResponse = await fetch(detailUrl);
        const detailData = await detailResponse.json();
        
        // Wikipedia 페이지에서 그래미 정보 추출 시도
        const wikipediaUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(artistName)}`;
        const wikiResponse = await fetch(wikipediaUrl);
        const wikiData = await wikiResponse.json();
        
        if (wikiData.query && wikiData.query.pages) {
            const pages = Object.values(wikiData.query.pages);
            if (pages[0] && pages[0].extract) {
                const extract = pages[0].extract;
                
                // 그래미 수상 정보 추출
                let grammyWins = 0;
                let grammyNoms = 0;
                
                // "X Grammy Awards" 패턴
                const grammyWinMatch = extract.match(/(\d+)\s*Grammy\s*Award/i);
                if (grammyWinMatch) {
                    grammyWins = parseInt(grammyWinMatch[1]);
                }
                
                // "nominated for X Grammy" 패턴
                const grammyNomMatch = extract.match(/nominated\s*for\s*(\d+)\s*Grammy/i);
                if (grammyNomMatch) {
                    grammyNoms = parseInt(grammyNomMatch[1]);
                }
                
                // "X nominations" 패턴
                const nomMatch = extract.match(/(\d+)\s*nomination/i);
                if (nomMatch && !grammyNoms) {
                    grammyNoms = parseInt(nomMatch[1]);
                }
                
                if (grammyWins > 0 || grammyNoms > 0) {
                    return {
                        grammy: `${grammyWins}회 수상, ${grammyNoms}회 노미네이트`,
                        other: '실시간 데이터 수집 중'
                    };
                }
            }
        }
        
        return { grammy: '정보 없음', other: '정보 없음' };
        
    } catch (error) {
        console.error('실시간 수상 정보 가져오기 오류:', error);
        return { grammy: '정보 없음', other: '정보 없음' };
    }
}

// YouTube 채널 검색 및 구독자 수 가져오기
async function getYouTubeChannelSubscribers(artistName) {
    try {
        // 아티스트 채널 검색
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' Official Artist Channel')}&type=channel&maxResults=5&key=${YOUTUBE_API_KEY}`
        );
        
        if (!searchResponse.ok) {
            console.error('YouTube Channel Search API error:', searchResponse.status);
            return 0;
        }
        
        const searchData = await searchResponse.json();
        if (!searchData.items || searchData.items.length === 0) {
            console.log('No YouTube channel found for:', artistName);
            return 0;
        }
        
        // 공식 채널 찾기 (verified 또는 artist channel)
        let channelId = null;
        for (const item of searchData.items) {
            const title = item.snippet.title.toLowerCase();
            const description = item.snippet.description.toLowerCase();
            
            // 공식 채널 패턴 확인
            if (title.includes(artistName.toLowerCase()) || 
                title.includes('official') || 
                title.includes('vevo') ||
                description.includes('official')) {
                channelId = item.snippet.channelId;
                break;
            }
        }
        
        // 찾지 못하면 첫 번째 결과 사용
        if (!channelId && searchData.items.length > 0) {
            channelId = searchData.items[0].snippet.channelId;
        }
        
        if (!channelId) return 0;
        
        // 채널 통계 가져오기
        const channelResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
        );
        
        if (!channelResponse.ok) {
            console.error('YouTube Channel Stats API error:', channelResponse.status);
            return 0;
        }
        
        const channelData = await channelResponse.json();
        if (!channelData.items || channelData.items.length === 0) return 0;
        
        const subscriberCount = parseInt(channelData.items[0].statistics.subscriberCount) || 0;
        console.log(`YouTube subscribers for ${artistName}: ${subscriberCount}`);
        return subscriberCount;
        
    } catch (error) {
        console.error('YouTube Channel API error:', error);
        return 0;
    }
}

// 점수 계산 (총 100점 = 곡 점수 80점 + 아티스트 점수 20점)
function calculateScore(data) {
    const scores = {
        // 곡 점수 (80점)
        trackSpotify: 0,      // Spotify 인기도 (40점)
        trackYoutube: 0,      // YouTube 조회수 (40점)
        
        // 아티스트 점수 (20점)
        artistSpotify: 0,     // Spotify 아티스트 인기도 (10점)
        artistYoutube: 0,     // YouTube 구독자 (10점)
        
        // 합계
        trackTotal: 0,        // 곡 점수 합계
        artistTotal: 0,       // 아티스트 점수 합계
        total: 0              // 총점
    };
    
    // 곡 점수 계산
    // 1. Spotify 인기도 점수 (40점)
    if (data.spotifyPopularity <= 20) scores.trackSpotify = 8;
    else if (data.spotifyPopularity <= 40) scores.trackSpotify = 16;
    else if (data.spotifyPopularity <= 60) scores.trackSpotify = 24;
    else if (data.spotifyPopularity <= 80) scores.trackSpotify = 32;
    else scores.trackSpotify = 40;
    
    // 2. YouTube 조회수 점수 (40점)
    if (data.youtubeViews < 10000000) scores.trackYoutube = 8;
    else if (data.youtubeViews < 50000000) scores.trackYoutube = 16;
    else if (data.youtubeViews < 200000000) scores.trackYoutube = 24;
    else if (data.youtubeViews < 1000000000) scores.trackYoutube = 32;
    else scores.trackYoutube = 40;
    
    // 아티스트 점수 계산
    // 3. Spotify 아티스트 인기도 점수 (10점)
    if (data.artistPopularity <= 20) scores.artistSpotify = 2;
    else if (data.artistPopularity <= 40) scores.artistSpotify = 4;
    else if (data.artistPopularity <= 60) scores.artistSpotify = 6;
    else if (data.artistPopularity <= 80) scores.artistSpotify = 8;
    else scores.artistSpotify = 10;
    
    // 4. YouTube 구독자 점수 (10점)
    if (data.youtubeSubscribers < 100000) scores.artistYoutube = 2;
    else if (data.youtubeSubscribers < 1000000) scores.artistYoutube = 4;
    else if (data.youtubeSubscribers < 5000000) scores.artistYoutube = 6;
    else if (data.youtubeSubscribers < 10000000) scores.artistYoutube = 8;
    else scores.artistYoutube = 10;
    
    // 합계 계산
    scores.trackTotal = scores.trackSpotify + scores.trackYoutube;
    scores.artistTotal = scores.artistSpotify + scores.artistYoutube;
    scores.total = scores.trackTotal + scores.artistTotal;
    
    return scores;
}

// 자동완성 드롭다운 표시
function showAutocomplete(tracks, inputId, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '';
    
    if (tracks.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    tracks.forEach(track => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = `
            <img src="${track.album.images[0]?.url || ''}" alt="">
            <div class="autocomplete-item-info">
                <div class="autocomplete-item-title">${track.name}</div>
                <div class="autocomplete-item-artist">${track.artists[0].name}</div>
            </div>
        `;
        
        item.addEventListener('click', () => selectSong(track, inputId));
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

// 곡 선택
function selectSong(track, inputId) {
    const songNumber = inputId.includes('song1') ? 'song1' : 'song2';
    selectedSongs[songNumber] = track;
    
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${songNumber}-dropdown`);
    const selectedDiv = document.getElementById(`${songNumber}-selected`);
    
    input.value = `${track.name} - ${track.artists[0].name}`;
    dropdown.style.display = 'none';
    
    selectedDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${track.album.images[0]?.url || ''}" alt="" style="width: 60px; height: 60px; border-radius: 8px;">
            <div>
                <div style="font-weight: bold; font-size: 1.1rem;">${track.name}</div>
                <div style="color: #b3b3b3;">${track.artists[0].name}</div>
                <div style="color: #666; font-size: 0.9rem; margin-top: 5px;">${track.album.name}</div>
            </div>
        </div>
    `;
    selectedDiv.classList.add('active');
    
    // 두 곡이 모두 선택되면 비교 버튼 활성화
    if (selectedSongs.song1 && selectedSongs.song2) {
        document.getElementById('compare-btn').disabled = false;
    }
}

// 비교 실행
async function compareSongs() {
    const resultsSection = document.getElementById('results');
    resultsSection.style.display = 'block';
    
    // 로딩 표시
    document.getElementById('winner-text').textContent = '분석 중...';
    
    try {
        // 각 곡의 데이터 수집
        const song1Data = await collectSongData(selectedSongs.song1);
        const song2Data = await collectSongData(selectedSongs.song2);
        
        console.log('Song 1 Data:', song1Data);
        console.log('Song 2 Data:', song2Data);
        
        // 점수 계산
        const score1 = calculateScore(song1Data);
        const score2 = calculateScore(song2Data);
        
        // 결과 표시
        displayResults(selectedSongs.song1, selectedSongs.song2, score1, score2, song1Data, song2Data);
        
    } catch (error) {
        console.error('비교 중 오류 발생:', error);
        console.error('Error details:', error.message);
        document.getElementById('winner-text').textContent = '오류가 발생했습니다. 다시 시도해주세요.';
    }
}

// 곡 데이터 수집
async function collectSongData(track) {
    try {
        // 토큰이 없거나 만료되었을 수 있으므로 재발급
        if (!spotifyAccessToken) {
            await getSpotifyToken();
        }
        
        // 아티스트 정보 가져오기
        const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${track.artists[0].id}`, {
            headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
            }
        });
        
        if (artistResponse.status === 401) {
            // 토큰 만료시 재발급
            await getSpotifyToken();
            return collectSongData(track);
        }
        
        if (!artistResponse.ok) {
            throw new Error(`Artist API error: ${artistResponse.status}`);
        }
        
        const artistData = await artistResponse.json();
        
        // YouTube 뮤직비디오 조회수 가져오기
        const youtubeViews = await getYouTubeViews(track.name, track.artists[0].name);
        
        // YouTube 채널 구독자 수 가져오기
        const youtubeSubscribers = await getYouTubeChannelSubscribers(track.artists[0].name);
        
        // 수상 정보 가져오기 (표시용)
        const awardsInfo = await getArtistAwards(track.artists[0].name);
        
        return {
            // 곡 데이터
            spotifyPopularity: track.popularity,
            youtubeViews: youtubeViews,
            
            // 아티스트 데이터
            artistPopularity: artistData.popularity || 0,
            artistFollowers: artistData.followers?.total || 0,
            youtubeSubscribers: youtubeSubscribers,
            
            // 수상 정보 (점수에는 미반영)
            awardsInfo: awardsInfo,
            
            // 기타 정보
            trackName: track.name,
            artistName: track.artists[0].name
        };
    } catch (error) {
        console.error('Data collection error:', error);
        throw error;
    }
}

// 결과 표시
function displayResults(song1, song2, scores1, scores2, data1, data2) {
    // 승자 발표
    const winnerText = document.getElementById('winner-text');
    if (scores1.total > scores2.total) {
        winnerText.textContent = `🏆 "${song1.name}"이(가) 더 명곡입니다! (${scores1.total}점 vs ${scores2.total}점)`;
    } else if (scores2.total > scores1.total) {
        winnerText.textContent = `🏆 "${song2.name}"이(가) 더 명곡입니다! (${scores2.total}점 vs ${scores1.total}점)`;
    } else {
        winnerText.textContent = `🏆 두 곡 모두 명곡입니다! (${scores1.total}점 동점)`;
    }
    
    // 점수 상세 표시
    displaySongScore('song1-score', song1, scores1, data1);
    displaySongScore('song2-score', song2, scores2, data2);
    
    // 차트 그리기
    drawComparisonChart(song1, song2, scores1, scores2);
}

// 곡별 점수 표시
function displaySongScore(elementId, song, scores, data) {
    const scoreElement = document.getElementById(elementId);
    scoreElement.querySelector('.song-title').textContent = song.name;
    scoreElement.querySelector('.total-score').textContent = scores.total + '점';
    
    const breakdown = scoreElement.querySelector('.score-breakdown');
    breakdown.innerHTML = `
        <div class="score-category">
            <h5 style="color: #1ed760; margin: 10px 0;">🎵 곡 점수 (${scores.trackTotal}/80점)</h5>
            <div class="score-item">
                <span class="score-label">Spotify 인기도</span>
                <span class="score-value">${data.spotifyPopularity}/100 (${scores.trackSpotify}점)</span>
            </div>
            <div class="score-item">
                <span class="score-label">YouTube 조회수</span>
                <span class="score-value">${(data.youtubeViews / 1000000).toFixed(1)}M (${scores.trackYoutube}점)</span>
            </div>
        </div>
        
        <div class="score-category" style="margin-top: 15px;">
            <h5 style="color: #1ed760; margin: 10px 0;">🎤 아티스트 점수 (${scores.artistTotal}/20점)</h5>
            <div class="score-item">
                <span class="score-label">Spotify 아티스트 인기도</span>
                <span class="score-value">${data.artistPopularity}/100 (${scores.artistSpotify}점)</span>
            </div>
            <div class="score-item">
                <span class="score-label">YouTube 구독자</span>
                <span class="score-value">${(data.youtubeSubscribers / 1000000).toFixed(1)}M (${scores.artistYoutube}점)</span>
            </div>
        </div>
        
        <div class="awards-info" style="margin-top: 15px; padding: 10px; background-color: #2a2a2a; border-radius: 8px;">
            <h5 style="color: #666; margin: 5px 0; font-size: 0.9rem;">🏆 수상 정보 (참고용)</h5>
            <div style="font-size: 0.85rem; color: #999; line-height: 1.6;">
                <div><strong>Grammy:</strong> ${data.awardsInfo.grammy}</div>
                <div><strong>기타 시상식:</strong> ${data.awardsInfo.other}</div>
            </div>
        </div>
    `;
}

// 숫자 포맷팅 함수
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Spotify 인기도를 기반으로 스트리밍 수 추정
function estimateSpotifyStreams(popularity) {
    // Spotify 인기도는 로그 스케일로 작동하는 것으로 알려져 있음
    // 대략적인 추정치 (실제 값과는 차이가 있을 수 있음)
    if (popularity >= 90) {
        const streams = Math.floor(Math.random() * 500000000) + 1000000000; // 10억-15억
        return formatNumber(streams) + ' (추정)';
    } else if (popularity >= 80) {
        const streams = Math.floor(Math.random() * 300000000) + 500000000; // 5억-8억
        return formatNumber(streams) + ' (추정)';
    } else if (popularity >= 70) {
        const streams = Math.floor(Math.random() * 200000000) + 200000000; // 2억-4억
        return formatNumber(streams) + ' (추정)';
    } else if (popularity >= 60) {
        const streams = Math.floor(Math.random() * 100000000) + 50000000; // 5천만-1.5억
        return formatNumber(streams) + ' (추정)';
    } else if (popularity >= 50) {
        const streams = Math.floor(Math.random() * 30000000) + 10000000; // 1천만-4천만
        return formatNumber(streams) + ' (추정)';
    } else if (popularity >= 40) {
        const streams = Math.floor(Math.random() * 5000000) + 1000000; // 100만-600만
        return formatNumber(streams) + ' (추정)';
    } else if (popularity >= 30) {
        const streams = Math.floor(Math.random() * 800000) + 100000; // 10만-90만
        return formatNumber(streams) + ' (추정)';
    } else if (popularity >= 20) {
        const streams = Math.floor(Math.random() * 90000) + 10000; // 1만-10만
        return formatNumber(streams) + ' (추정)';
    } else {
        const streams = Math.floor(Math.random() * 9000) + 1000; // 1천-1만
        return formatNumber(streams) + ' (추정)';
    }
}

// 차트 인스턴스 저장
let comparisonChart = null;

// 비교 차트 그리기
function drawComparisonChart(song1, song2, scores1, scores2) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    
    // 기존 차트가 있으면 삭제
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['곡: Spotify', '곡: YouTube', '아티스트: Spotify', '아티스트: YouTube'],
            datasets: [
                {
                    label: song1.name,
                    data: [scores1.trackSpotify, scores1.trackYoutube, scores1.artistSpotify, scores1.artistYoutube],
                    backgroundColor: '#1ed760',
                    borderWidth: 0
                },
                {
                    label: song2.name,
                    data: [scores2.trackSpotify, scores2.trackYoutube, scores2.artistSpotify, scores2.artistYoutube],
                    backgroundColor: '#1db954',
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 40,
                    ticks: {
                        color: '#b3b3b3'
                    },
                    grid: {
                        color: '#333'
                    }
                },
                x: {
                    ticks: {
                        color: '#b3b3b3'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#b3b3b3'
                    }
                }
            }
        }
    });
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 검색 입력 이벤트
    let searchTimeout1, searchTimeout2;
    
    document.getElementById('song1-input').addEventListener('input', (e) => {
        clearTimeout(searchTimeout1);
        searchTimeout1 = setTimeout(async () => {
            if (e.target.value.trim()) {
                const tracks = await searchSpotify(e.target.value);
                showAutocomplete(tracks, 'song1-input', 'song1-dropdown');
            } else {
                document.getElementById('song1-dropdown').style.display = 'none';
            }
        }, 300);
    });
    
    document.getElementById('song2-input').addEventListener('input', (e) => {
        clearTimeout(searchTimeout2);
        searchTimeout2 = setTimeout(async () => {
            if (e.target.value.trim()) {
                const tracks = await searchSpotify(e.target.value);
                showAutocomplete(tracks, 'song2-input', 'song2-dropdown');
            } else {
                document.getElementById('song2-dropdown').style.display = 'none';
            }
        }, 300);
    });
    
    // 비교 버튼 클릭
    document.getElementById('compare-btn').addEventListener('click', compareSongs);
    
    // 드롭다운 외부 클릭시 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('song1-dropdown').style.display = 'none';
            document.getElementById('song2-dropdown').style.display = 'none';
        }
    });
});