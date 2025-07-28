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

        // YouTube 검색
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=3&key=${process.env.YOUTUBE_API_KEY}`
        );

        if (!searchResponse.ok) {
            throw new Error(`YouTube API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(searchData)
        };
    } catch (error) {
        console.error('YouTube search error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'YouTube search failed', details: error.message })
        };
    }
};