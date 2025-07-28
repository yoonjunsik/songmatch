const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// Spotify 토큰 저장
let spotifyAccessToken = null;
let tokenExpiryTime = null;

// Spotify 토큰 가져오기
async function getSpotifyToken() {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
                ).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });
        
        const data = await response.json();
        spotifyAccessToken = data.access_token;
        tokenExpiryTime = Date.now() + (data.expires_in * 1000);
        
        return data.access_token;
    } catch (error) {
        console.error('Spotify token error:', error);
        throw error;
    }
}

// 토큰 유효성 확인
async function ensureValidToken() {
    if (!spotifyAccessToken || Date.now() >= tokenExpiryTime) {
        await getSpotifyToken();
    }
}

// Spotify 검색 API
app.get('/api/spotify/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        await ensureValidToken();

        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`,
            {
                headers: {
                    'Authorization': `Bearer ${spotifyAccessToken}`
                }
            }
        );

        const data = await response.json();
        res.json(data.tracks.items);
    } catch (error) {
        console.error('Spotify search error:', error);
        res.status(500).json({ error: 'Spotify search failed' });
    }
});

// Spotify 아티스트 정보 API
app.get('/api/spotify/artist/:id', async (req, res) => {
    try {
        await ensureValidToken();

        const response = await fetch(
            `https://api.spotify.com/v1/artists/${req.params.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${spotifyAccessToken}`
                }
            }
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Spotify artist error:', error);
        res.status(500).json({ error: 'Spotify artist fetch failed' });
    }
});

// YouTube 검색 API
app.get('/api/youtube/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=3&key=${process.env.YOUTUBE_API_KEY}`
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('YouTube search error:', error);
        res.status(500).json({ error: 'YouTube search failed' });
    }
});

// YouTube 비디오 통계 API
app.get('/api/youtube/stats/:videoId', async (req, res) => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${req.params.videoId}&key=${process.env.YOUTUBE_API_KEY}`
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('YouTube stats error:', error);
        res.status(500).json({ error: 'YouTube stats fetch failed' });
    }
});

// 헬스 체크
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 SongMatch API Server running on port ${PORT}`);
});