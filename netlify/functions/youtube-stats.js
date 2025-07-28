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
        const { videoId } = event.queryStringParameters;
        
        if (!videoId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Video ID parameter required' })
            };
        }

        // YouTube 비디오 통계 가져오기
        const statsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
        );

        if (!statsResponse.ok) {
            throw new Error(`YouTube Stats API error: ${statsResponse.status}`);
        }

        const statsData = await statsResponse.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(statsData)
        };
    } catch (error) {
        console.error('YouTube stats error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'YouTube stats fetch failed', details: error.message })
        };
    }
};