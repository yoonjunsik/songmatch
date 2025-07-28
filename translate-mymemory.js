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

        // MyMemory API로 번역
        const translatedText = await translateWithMyMemory(lyrics);
        
        // 번역 타입에 따른 처리
        const result = processTranslation(translatedText, lyrics, type, song, artist);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
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

// MyMemory Translation API
async function translateWithMyMemory(text) {
    try {
        // 5000자 제한이 있으므로 텍스트 분할
        const maxLength = 500;
        const chunks = [];
        const lines = text.split('\n');
        let currentChunk = '';
        
        for (const line of lines) {
            if ((currentChunk + line).length > maxLength) {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = line;
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }
        if (currentChunk) chunks.push(currentChunk);
        
        // 각 청크 번역
        const translatedChunks = [];
        for (const chunk of chunks) {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|ko`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.responseStatus === 200) {
                translatedChunks.push(data.responseData.translatedText);
            } else {
                translatedChunks.push(chunk); // 실패시 원문 유지
            }
            
            // API 제한 회피를 위한 딜레이
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return translatedChunks.join('\n');
    } catch (error) {
        console.error('MyMemory error:', error);
        throw error;
    }
}

// 번역 처리
function processTranslation(translatedText, originalLyrics, type, song, artist) {
    let finalTranslation = '';
    let songMeaning = '';
    
    switch (type) {
        case 'direct':
            finalTranslation = `[직역]\n"${song}" - ${artist}\n\n${translatedText}`;
            songMeaning = `직역된 가사입니다. 원문의 의미를 그대로 전달합니다.`;
            break;
            
        case 'cultural':
            finalTranslation = `[의역 - 문화적 맥락]\n"${song}" - ${artist}\n\n${translatedText}`;
            finalTranslation += '\n\n' + addSimpleCulturalContext(originalLyrics);
            songMeaning = `문화적 차이를 고려한 의역입니다.`;
            break;
            
        case 'hiphop':
            finalTranslation = `[힙합 특화 해석]\n"${song}" - ${artist}\n\n${translatedText}`;
            finalTranslation += '\n\n' + addSimpleHiphopContext(originalLyrics);
            songMeaning = `힙합 문화와 슬랭을 고려한 해석입니다.`;
            break;
    }
    
    return {
        originalLyrics: originalLyrics,
        translatedLyrics: finalTranslation,
        songMeaning: songMeaning
    };
}

// 간단한 문화적 맥락
function addSimpleCulturalContext(lyrics) {
    const lower = lyrics.toLowerCase();
    const contexts = [];
    
    if (lower.includes('hood')) contexts.push('• "hood" = 동네, 출신 지역');
    if (lower.includes('hustle')) contexts.push('• "hustle" = 열심히 일하다, 돈 벌다');
    if (lower.includes('grind')) contexts.push('• "grind" = 갈고 닦다, 노력하다');
    
    return contexts.length > 0 ? '[문화적 표현]\n' + contexts.join('\n') : '';
}

// 간단한 힙합 맥락
function addSimpleHiphopContext(lyrics) {
    const lower = lyrics.toLowerCase();
    const contexts = [];
    
    const basicTerms = {
        'drip': '패션, 스타일',
        'cap': '거짓말',
        'bars': '랩 가사',
        'fire': '멋진, 최고의',
        'lit': '신나는',
        'goat': '역대 최고'
    };
    
    for (const [term, meaning] of Object.entries(basicTerms)) {
        if (lower.includes(term)) {
            contexts.push(`• "${term}" = ${meaning}`);
        }
    }
    
    return contexts.length > 0 ? '[힙합 용어]\n' + contexts.join('\n') : '';
}