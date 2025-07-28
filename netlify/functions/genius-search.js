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

        // Genius API 검색
        const searchResponse = await fetch(
            `https://api.genius.com/search?q=${encodeURIComponent(q)}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`
                }
            }
        );

        if (!searchResponse.ok) {
            throw new Error(`Genius API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        
        // 첫 번째 결과의 URL 가져오기
        if (searchData.response.hits && searchData.response.hits.length > 0) {
            const songData = searchData.response.hits[0].result;
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    id: songData.id,
                    title: songData.title,
                    artist: songData.primary_artist.name,
                    url: songData.url,
                    path: songData.path
                })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'No lyrics found' })
        };
    } catch (error) {
        console.error('Genius search error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Genius search failed', details: error.message })
        };
    }
};