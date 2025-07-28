const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { q } = event.queryStringParameters;
        
        if (!q) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Query parameter required' })
            };
        }

        // Spotify 토큰 가져오기
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
                ).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
            throw new Error('Failed to get Spotify token');
        }

        // Spotify 검색
        const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`,
            {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`
                }
            }
        );

        if (!searchResponse.ok) {
            throw new Error(`Spotify API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(searchData.tracks.items)
        };
    } catch (error) {
        console.error('Spotify search error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Spotify search failed', details: error.message })
        };
    }
};