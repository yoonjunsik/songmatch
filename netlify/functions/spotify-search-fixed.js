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
        const { q } = event.queryStringParameters || {};
        
        if (!q) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Query parameter required' })
            };
        }

        // Spotify 토큰 가져오기 - fetch 사용
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

        if (!tokenResponse.ok) {
            throw new Error(`Token request failed: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
            throw new Error('No access token received');
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
            body: JSON.stringify(searchData.tracks?.items || [])
        };
    } catch (error) {
        console.error('Spotify search error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Spotify search failed', 
                details: error.message,
                env: {
                    hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
                    hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET
                }
            })
        };
    }
};