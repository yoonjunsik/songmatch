exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { channelId } = event.queryStringParameters || {};
        
        if (!channelId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Channel ID required' })
            };
        }

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) {
            throw new Error('YouTube API key not configured');
        }

        // YouTube API로 채널 정보 가져오기
        const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
        
        console.log('Fetching channel stats for:', channelId);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('YouTube API error:', error);
            throw new Error(`YouTube API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    channelId: channelId,
                    subscriberCount: 0,
                    found: false
                })
            };
        }
        
        const channel = data.items[0];
        const statistics = channel.statistics;
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                channelId: channelId,
                subscriberCount: parseInt(statistics.subscriberCount) || 0,
                viewCount: parseInt(statistics.viewCount) || 0,
                videoCount: parseInt(statistics.videoCount) || 0,
                found: true
            })
        };
        
    } catch (error) {
        console.error('Channel stats error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                channelId: event.queryStringParameters?.channelId || '',
                subscriberCount: 0,
                error: error.message,
                found: false
            })
        };
    }
};