exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { lyrics, type, song, artist } = JSON.parse(event.body);
        
        if (!lyrics) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Lyrics required' })
            };
        }

        // Google Translate API 사용 (또는 다른 번역 API)
        // 여기서는 데모 번역을 제공합니다
        
        let translatedLyrics = '';
        let songMeaning = '';
        
        switch (type) {
            case 'direct':
                translatedLyrics = `[직역] "${song}" - ${artist}\n\n`;
                translatedLyrics += generateDirectTranslation(lyrics);
                songMeaning = `이 곡은 ${artist}의 대표곡 중 하나로, 직역하면 다음과 같은 의미를 담고 있습니다.`;
                break;
                
            case 'cultural':
                translatedLyrics = `[의역] "${song}" - ${artist}\n\n`;
                translatedLyrics += generateCulturalTranslation(lyrics);
                songMeaning = `이 곡은 문화적 맥락을 고려하여 해석하면, 한국 정서에 맞게 재해석할 수 있습니다.`;
                break;
                
            case 'hiphop':
                translatedLyrics = `[힙합 특화 해석] "${song}" - ${artist}\n\n`;
                translatedLyrics += generateHiphopTranslation(lyrics);
                songMeaning = `힙합 문화의 관점에서 이 곡은 슬랭과 은유, 라임 등을 활용하여 깊은 의미를 전달합니다.`;
                break;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                originalLyrics: lyrics,
                translatedLyrics: translatedLyrics,
                songMeaning: songMeaning
            })
        };
    } catch (error) {
        console.error('Translation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Translation failed', details: error.message })
        };
    }
};

// 데모 번역 함수들
function generateDirectTranslation(lyrics) {
    // 실제로는 Google Translate API 등을 사용
    return `${lyrics.substring(0, 200)}...\n\n[실제 번역 API가 연동되면 전체 가사의 직역이 여기에 표시됩니다]`;
}

function generateCulturalTranslation(lyrics) {
    return `${lyrics.substring(0, 200)}...\n\n[실제 번역 API가 연동되면 문화적 맥락을 고려한 의역이 여기에 표시됩니다]`;
}

function generateHiphopTranslation(lyrics) {
    return `${lyrics.substring(0, 200)}...\n\n[실제 번역 API가 연동되면 힙합 특화 해석이 여기에 표시됩니다. 슬랭, 은유, 라임 등을 한국어로 재해석]`;
}