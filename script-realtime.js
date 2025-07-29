// 실시간 API를 사용하는 버전
const API_BASE_URL = '/.netlify/functions'; // Netlify Functions 경로

let spotifyAccessToken = null;
let selectedSongs = {
    song1: null,
    song2: null
};

let interpretSelectedSong = null;

// Netlify Functions를 통한 Spotify 검색
async function searchSpotify(query) {
    console.log('Searching Spotify for:', query);
    
    try {
        const response = await fetch(`${API_BASE_URL}/spotify-search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            console.error('API error:', response.status, response.statusText);
            const errorData = await response.json();
            console.error('Error details:', errorData);
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

// Netlify Functions를 통한 아티스트 정보 가져오기
async function getArtistInfo(artistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/spotify-artist?id=${artistId}`);
        
        if (!response.ok) {
            throw new Error(`Artist API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Artist info error:', error);
        throw error;
    }
}

// Netlify Functions를 통한 YouTube 검색
async function searchYouTube(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/youtube-search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`YouTube search error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('YouTube search error:', error);
        throw error;
    }
}

// Netlify Functions를 통한 YouTube 비디오 통계
async function getYouTubeStats(videoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/youtube-stats?videoId=${videoId}`);
        
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
                        console.log('Found video:', item.snippet.title, 'by', item.snippet.channelTitle);
                        
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

// YouTube 채널 구독자 수 가져오기 (복잡하므로 일단 0으로 설정)
async function getYouTubeChannelSubscribers(artistName) {
    // 이 기능은 복잡하므로 일단 0으로 반환
    // 필요시 나중에 구현
    return 0;
}

// 아티스트 수상 정보 가져오기 (Wikipedia API 사용)
async function getArtistAwards(artistName) {
    try {
        console.log('Fetching awards info for:', artistName);
        
        // Wikipedia API 호출
        const response = await fetch(`${API_BASE_URL}/wikipedia-artist?artist=${encodeURIComponent(artistName)}`);
        
        if (!response.ok) {
            throw new Error('Wikipedia API error');
        }
        
        const data = await response.json();
        console.log('Wikipedia data:', data);
        
        // Wikipedia에서 정보를 찾았으면 반환
        if (data.grammy !== '정보 없음' || data.other !== '정보 없음') {
            return {
                grammy: data.grammy,
                other: data.other
            };
        }
        
        // Wikipedia에서 못 찾았으면 캐시된 데이터 확인
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
            'Eminem': { grammy: '15회 수상, 44회 노미네이트', other: 'MTV VMA 13회, Billboard Music Awards 17회' }
        };
        
        return cachedData[artistName] || { grammy: '정보 없음', other: '정보 없음' };
        
    } catch (error) {
        console.error('Error fetching artist awards:', error);
        // 에러 시 기본값 반환
        return { grammy: '정보 없음', other: '정보 없음' };
    }
}

// 점수 계산 (세분화된 버전)
function calculateScore(data) {
    const scores = {
        trackSpotify: 0,
        trackYoutube: 0,
        artistSpotify: 0,
        artistYoutube: 0,
        trackTotal: 0,
        artistTotal: 0,
        total: 0
    };
    
    // 곡 점수 계산 (최대 40점)
    // Spotify 인기도: 선형 스케일 (0-100 → 0-40)
    scores.trackSpotify = (data.spotifyPopularity / 100) * 40;
    
    // YouTube 조회수: 로그 스케일 (더 자연스러운 분포)
    // 1뷰 = 0점, 10억뷰 = 40점
    const viewsLog = Math.log10(Math.max(data.youtubeViews, 1));
    // log10(1) = 0, log10(1B) = 9, 정규화하여 0-40점으로
    scores.trackYoutube = Math.min((viewsLog / 9) * 40, 40);
    
    // 아티스트 점수 계산 (최대 10점)
    // Spotify 아티스트 인기도: 선형 스케일 (0-100 → 0-10)
    scores.artistSpotify = (data.artistPopularity / 100) * 10;
    
    // YouTube 구독자 수: 로그 스케일
    // 1명 = 0점, 1억명 = 10점
    const subsLog = Math.log10(Math.max(data.youtubeSubscribers, 1));
    // log10(1) = 0, log10(100M) = 8, 정규화하여 0-10점으로
    scores.artistYoutube = Math.min((subsLog / 8) * 10, 10);
    
    // 소수점 첫째 자리까지 반올림
    scores.trackSpotify = Math.round(scores.trackSpotify * 10) / 10;
    scores.trackYoutube = Math.round(scores.trackYoutube * 10) / 10;
    scores.artistSpotify = Math.round(scores.artistSpotify * 10) / 10;
    scores.artistYoutube = Math.round(scores.artistYoutube * 10) / 10;
    
    scores.trackTotal = Math.round((scores.trackSpotify + scores.trackYoutube) * 10) / 10;
    scores.artistTotal = Math.round((scores.artistSpotify + scores.artistYoutube) * 10) / 10;
    scores.total = Math.round((scores.trackTotal + scores.artistTotal) * 10) / 10;
    
    return scores;
}

// 곡 데이터 수집 (실시간 API 사용)
async function collectSongData(track) {
    try {
        console.log('Collecting data for:', track.name, 'by', track.artists[0].name);
        
        // 아티스트 정보 가져오기
        const artistData = await getArtistInfo(track.artists[0].id);
        console.log('Artist data:', artistData);
        
        // YouTube 뮤직비디오 조회수 가져오기
        const youtubeViews = await getYouTubeViews(track.name, track.artists[0].name);
        
        // YouTube 채널 구독자 수 가져오기
        const youtubeSubscribers = await getYouTubeChannelSubscribers(track.artists[0].name);
        
        // 수상 정보 가져오기
        const awardsInfo = await getArtistAwards(track.artists[0].name);
        
        return {
            spotifyPopularity: track.popularity,
            youtubeViews: youtubeViews,
            artistPopularity: artistData.popularity || 0,
            artistFollowers: artistData.followers?.total || 0,
            youtubeSubscribers: youtubeSubscribers,
            awardsInfo: awardsInfo,
            trackName: track.name,
            artistName: track.artists[0].name
        };
    } catch (error) {
        console.error('Data collection error:', error);
        throw error;
    }
}

// 나머지 UI 관련 함수들은 기존 script.js에서 복사
// (자동완성, 비교, 결과 표시 등)

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
            <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/40x40/333/fff?text=♪'}" alt="">
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
            <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/60x60/333/fff?text=♪'}" alt="" style="width: 60px; height: 60px; border-radius: 8px;">
            <div>
                <div style="font-weight: bold; font-size: 1.1rem;">${track.name}</div>
                <div style="color: #b3b3b3;">${track.artists[0].name}</div>
                <div style="color: #666; font-size: 0.9rem; margin-top: 5px;">${track.album.name}</div>
            </div>
        </div>
    `;
    selectedDiv.classList.add('active');
    
    if (selectedSongs.song1 && selectedSongs.song2) {
        document.getElementById('compare-btn').disabled = false;
    }
}

// 비교 실행
async function compareSongs() {
    const resultsSection = document.getElementById('results');
    resultsSection.style.display = 'block';
    
    document.getElementById('winner-text').textContent = '실시간 데이터 분석 중...';
    
    try {
        const song1Data = await collectSongData(selectedSongs.song1);
        const song2Data = await collectSongData(selectedSongs.song2);
        
        console.log('Song 1 Data:', song1Data);
        console.log('Song 2 Data:', song2Data);
        
        const score1 = calculateScore(song1Data);
        const score2 = calculateScore(song2Data);
        
        displayResults(selectedSongs.song1, selectedSongs.song2, score1, score2, song1Data, song2Data);
        
    } catch (error) {
        console.error('비교 중 오류 발생:', error);
        document.getElementById('winner-text').textContent = '오류가 발생했습니다. 다시 시도해주세요.';
    }
}

// 결과 표시 (세분화된 점수 표시)
function displayResults(song1, song2, scores1, scores2, data1, data2) {
    const winnerText = document.getElementById('winner-text');
    const scoreDiff = Math.abs(scores1.total - scores2.total);
    
    if (scores1.total > scores2.total) {
        if (scoreDiff < 2) {
            winnerText.textContent = `🏆 "${song1.name}"이(가) 근소한 차이로 승리! (${scores1.total}점 vs ${scores2.total}점)`;
        } else {
            winnerText.textContent = `🏆 "${song1.name}"이(가) 더 명곡입니다! (${scores1.total}점 vs ${scores2.total}점)`;
        }
    } else if (scores2.total > scores1.total) {
        if (scoreDiff < 2) {
            winnerText.textContent = `🏆 "${song2.name}"이(가) 근소한 차이로 승리! (${scores2.total}점 vs ${scores1.total}점)`;
        } else {
            winnerText.textContent = `🏆 "${song2.name}"이(가) 더 명곡입니다! (${scores2.total}점 vs ${scores1.total}점)`;
        }
    } else {
        winnerText.textContent = `🏆 두 곡 모두 명곡입니다! (${scores1.total}점 동점)`;
    }
    
    displaySongScore('song1-score', song1, scores1, data1);
    displaySongScore('song2-score', song2, scores2, data2);
    drawComparisonChart(song1, song2, scores1, scores2);
}

// 곡별 점수 표시
function displaySongScore(elementId, song, scores, data) {
    const scoreElement = document.getElementById(elementId);
    scoreElement.querySelector('.song-title').textContent = song.name;
    scoreElement.querySelector('.total-score').textContent = scores.total + '점';
    
    const breakdown = scoreElement.querySelector('.score-breakdown');
    
    // 진행바 생성 함수
    function createProgressBar(value, max, color = '#1ed760') {
        const percentage = (value / max) * 100;
        return `
            <div style="background-color: #333; border-radius: 10px; height: 8px; margin: 5px 0; overflow: hidden;">
                <div style="background-color: ${color}; height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
            </div>
        `;
    }
    
    // 조회수/구독자수 포맷팅 함수
    function formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    breakdown.innerHTML = `
        <div class="score-category">
            <h5 style="color: #1ed760; margin: 10px 0;">🎵 곡 점수 (${scores.trackTotal}/80점)</h5>
            <div class="score-item">
                <span class="score-label">Spotify 인기도</span>
                <span class="score-value">${data.spotifyPopularity}/100 (${scores.trackSpotify}점)</span>
                ${createProgressBar(scores.trackSpotify, 40)}
            </div>
            <div class="score-item">
                <span class="score-label">YouTube 조회수</span>
                <span class="score-value">${formatNumber(data.youtubeViews)} views (${scores.trackYoutube}점)</span>
                ${createProgressBar(scores.trackYoutube, 40, '#ff0000')}
            </div>
        </div>
        
        <div class="score-category" style="margin-top: 15px;">
            <h5 style="color: #1ed760; margin: 10px 0;">🎤 아티스트 점수 (${scores.artistTotal}/20점)</h5>
            <div class="score-item">
                <span class="score-label">Spotify 아티스트 인기도</span>
                <span class="score-value">${data.artistPopularity}/100 (${scores.artistSpotify}점)</span>
                ${createProgressBar(scores.artistSpotify, 10)}
            </div>
            <div class="score-item">
                <span class="score-label">YouTube 구독자</span>
                <span class="score-value">${formatNumber(data.youtubeSubscribers)} subs (${scores.artistYoutube}점)</span>
                ${createProgressBar(scores.artistYoutube, 10, '#ff0000')}
            </div>
        </div>
        
        <div class="score-summary" style="margin-top: 15px; padding: 15px; background-color: #1a1a1a; border-radius: 8px; border: 1px solid #333;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #1ed760; font-weight: bold;">총점</span>
                <span style="font-size: 1.5rem; font-weight: bold; color: #1ed760;">${scores.total}/100점</span>
            </div>
            ${createProgressBar(scores.total, 100, '#1ed760')}
            <div style="text-align: center; margin-top: 10px; color: #999; font-size: 0.9rem;">
                상위 ${Math.round(100 - scores.total)}% 수준
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

// 차트 그리기 (기존과 동일)
let comparisonChart = null;

function drawComparisonChart(song1, song2, scores1, scores2) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    
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
                    ticks: { color: '#b3b3b3' },
                    grid: { color: '#333' }
                },
                x: {
                    ticks: { color: '#b3b3b3' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#b3b3b3' }
                }
            }
        }
    });
}

// 곡 해석 기능 (기존과 동일)
function showInterpretAutocomplete(tracks) {
    const dropdown = document.getElementById('interpret-dropdown');
    dropdown.innerHTML = '';
    
    if (tracks.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    tracks.forEach(track => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = `
            <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/40x40/333/fff?text=♪'}" alt="">
            <div class="autocomplete-item-info">
                <div class="autocomplete-item-title">${track.name}</div>
                <div class="autocomplete-item-artist">${track.artists[0].name}</div>
            </div>
        `;
        
        item.addEventListener('click', () => selectInterpretSong(track));
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

function selectInterpretSong(track) {
    interpretSelectedSong = track;
    
    const input = document.getElementById('interpret-song-input');
    const dropdown = document.getElementById('interpret-dropdown');
    const selectedDiv = document.getElementById('interpret-selected');
    const startBtn = document.getElementById('start-interpret');
    
    input.value = `${track.name} - ${track.artists[0].name}`;
    dropdown.style.display = 'none';
    
    selectedDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; margin-top: 15px; padding: 15px; background-color: #333; border-radius: 8px;">
            <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/50x50/333/fff?text=♪'}" alt="" style="width: 50px; height: 50px; border-radius: 8px;">
            <div>
                <div style="font-weight: bold; color: #1ed760;">${track.name}</div>
                <div style="color: #b3b3b3;">${track.artists[0].name}</div>
            </div>
        </div>
    `;
    selectedDiv.style.display = 'block';
    startBtn.disabled = false;
}

async function startSongInterpretation() {
    if (!interpretSelectedSong) return;
    
    const loading = document.getElementById('interpret-loading');
    const result = document.getElementById('interpret-result');
    const startBtn = document.getElementById('start-interpret');
    
    loading.style.display = 'block';
    result.style.display = 'none';
    startBtn.disabled = true;
    
    try {
        const interpretType = document.querySelector('input[name="interpret-type"]:checked').value;
        console.log('Starting interpretation:', interpretSelectedSong.name, 'Type:', interpretType);
        const interpretation = await interpretSong(interpretSelectedSong, interpretType);
        displayInterpretation(interpretation);
    } catch (error) {
        console.error('곡 해석 중 오류 발생:', error);
        result.innerHTML = '<div style="text-align: center; color: #ff6b6b; padding: 30px;">해석 중 오류가 발생했습니다. 다시 시도해주세요.</div>';
        result.style.display = 'block';
    } finally {
        loading.style.display = 'none';
        startBtn.disabled = false;
    }
}

async function interpretSong(track, interpretType) {
    const song = track.name;
    const artist = track.artists[0].name;
    
    try {
        // Genius API로 가사 검색
        console.log('Searching lyrics for:', song, artist);
        const geniusResponse = await fetch(`${API_BASE_URL}/genius-search?q=${encodeURIComponent(song + ' ' + artist)}`);
        
        if (!geniusResponse.ok) {
            throw new Error('Lyrics search failed');
        }
        
        const geniusData = await geniusResponse.json();
        
        // 새로운 가사 API로 가사 가져오기
        console.log('Fetching lyrics...');
        const lyricsResponse = await fetch(`${API_BASE_URL}/lyrics-musixmatch?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(song)}`);
        
        let lyrics = '';
        if (lyricsResponse.ok) {
            const lyricsData = await lyricsResponse.json();
            console.log('Lyrics data:', lyricsData);
            lyrics = lyricsData.lyrics || '';
        }
        
        // 가사가 없으면 Genius 정보 사용
        if (!lyrics || lyrics.includes('[가사를 찾을 수 없습니다]')) {
            lyrics = `[${song} - ${artist}]\n\n가사를 로드하는 중...\n\n이 곡의 실제 가사는 저작권 보호를 받고 있습니다.\n번역 데모를 위한 샘플 텍스트가 제공됩니다.`;
        }
        
        // 실시간 번역 API 호출 (MyMemory API 사용)
        console.log('Calling real-time translation API...');
        const translateResponse = await fetch(`${API_BASE_URL}/translate-mymemory-api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lyrics: lyrics,
                type: interpretType,
                song: song,
                artist: artist
            })
        });
        
        console.log('Translation response status:', translateResponse.status);
        
        if (!translateResponse.ok) {
            const errorText = await translateResponse.text();
            console.error('Translation error response:', errorText);
            throw new Error('Translation failed: ' + translateResponse.status);
        }
        
        const translationData = await translateResponse.json();
        console.log('Translation data received:', translationData);
        
        return {
            originalLyrics: translationData.originalLyrics || lyrics,
            translatedLyrics: translationData.translatedLyrics || '번역 실패',
            songMeaning: translationData.songMeaning || '의미 분석 실패'
        };
        
    } catch (error) {
        console.error('Interpretation error:', error);
        // 에러 시 데모 데이터 반환
        return {
            originalLyrics: `"${song}" by ${artist}\n\n가사를 가져오는 중 오류가 발생했습니다.`,
            translatedLyrics: getTranslatedDemo(song, artist, interpretType),
            songMeaning: getSongMeaningDemo(song, artist, interpretType)
        };
    }
}

function getTranslatedDemo(song, artist, interpretType) {
    const interpretLabels = {
        'direct': '직역',
        'cultural': '의역 (문화적 맥락)',
        'hiphop': '힙합 특화 해석'
    };
    
    return `[${interpretLabels[interpretType]}] "${song}" - ${artist}

실시간 ${interpretLabels[interpretType]}이 여기에 표시됩니다.

실제 서비스에서는 AI 번역 API가 연동되어
선택한 해석 방식에 따라 다른 결과를 제공합니다.`;
}

function getSongMeaningDemo(song, artist, interpretType) {
    const meanings = {
        'direct': `"${song}"의 직역적 해석이 여기에 표시됩니다.`,
        'cultural': `"${song}"의 문화적 맥락 해석이 여기에 표시됩니다.`,
        'hiphop': `"${song}"의 힙합 특화 해석이 여기에 표시됩니다.`
    };
    
    return meanings[interpretType] || meanings['cultural'];
}

function displayInterpretation(interpretation) {
    const result = document.getElementById('interpret-result');
    const song = interpretSelectedSong;
    
    document.getElementById('result-song-title').textContent = song.name;
    document.getElementById('result-artist').textContent = song.artists[0].name;
    document.getElementById('original-text').textContent = interpretation.originalLyrics;
    document.getElementById('translated-text').textContent = interpretation.translatedLyrics;
    document.getElementById('song-context').textContent = interpretation.songMeaning;
    
    result.style.display = 'block';
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
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
    
    document.getElementById('compare-btn').addEventListener('click', compareSongs);
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('song1-dropdown').style.display = 'none';
            document.getElementById('song2-dropdown').style.display = 'none';
        }
        if (!e.target.closest('.song-search-section')) {
            document.getElementById('interpret-dropdown').style.display = 'none';
        }
    });
    
    // 곡 해석 모달 기능
    const interpretBtn = document.getElementById('interpret-btn');
    const interpretModal = document.getElementById('interpret-modal');
    const closeModal = document.getElementById('close-modal');
    const interpretInput = document.getElementById('interpret-song-input');
    const startInterpretBtn = document.getElementById('start-interpret');
    
    if (interpretBtn) {
        interpretBtn.addEventListener('click', () => {
            interpretModal.style.display = 'block';
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            interpretModal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === interpretModal) {
            interpretModal.style.display = 'none';
        }
    });
    
    if (interpretInput) {
        let interpretSearchTimeout;
        interpretInput.addEventListener('input', (e) => {
            clearTimeout(interpretSearchTimeout);
            interpretSearchTimeout = setTimeout(async () => {
                if (e.target.value.trim()) {
                    const tracks = await searchSpotify(e.target.value);
                    showInterpretAutocomplete(tracks);
                } else {
                    document.getElementById('interpret-dropdown').style.display = 'none';
                }
            }, 300);
        });
    }
    
    if (startInterpretBtn) {
        startInterpretBtn.addEventListener('click', startSongInterpretation);
    }
});