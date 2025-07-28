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
        const { artist, title } = event.queryStringParameters || {};
        
        if (!artist || !title) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Artist and title required' })
            };
        }

        // LyricsOVH API 사용 (무료, API 키 불필요)
        const lyricsResponse = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
        );

        if (!lyricsResponse.ok) {
            // 대체 API 시도 또는 Genius 사용
            throw new Error(`Lyrics not found: ${lyricsResponse.status}`);
        }

        const lyricsData = await lyricsResponse.json();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                lyrics: lyricsData.lyrics,
                source: 'LyricsOVH'
            })
        };
    } catch (error) {
        console.error('Lyrics fetch error:', error);
        
        // 에러 시 샘플 가사 반환
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                lyrics: `[가사를 찾을 수 없습니다]\n\n죄송합니다. "${event.queryStringParameters.title}"의 가사를 찾을 수 없습니다.\n\n다른 곡을 검색해보세요.`,
                source: 'error'
            })
        };
    }
};