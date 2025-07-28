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

        // 가사를 문단별로 분리
        const paragraphs = lyrics.split('\n\n').filter(p => p.trim());
        let translatedParagraphs = [];
        
        // 각 문단을 번역
        for (const paragraph of paragraphs) {
            const translated = await translateParagraph(paragraph, type);
            translatedParagraphs.push(translated);
        }

        // 번역 타입에 따른 추가 처리
        let finalTranslation = translatedParagraphs.join('\n\n');
        let songMeaning = '';

        switch (type) {
            case 'direct':
                songMeaning = generateDirectMeaning(song, artist, lyrics);
                break;
            case 'cultural':
                finalTranslation = await culturalAdaptation(finalTranslation, lyrics);
                songMeaning = generateCulturalMeaning(song, artist, lyrics);
                break;
            case 'hiphop':
                finalTranslation = await hiphopAdaptation(finalTranslation, lyrics);
                songMeaning = generateHiphopMeaning(song, artist, lyrics);
                break;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                originalLyrics: lyrics,
                translatedLyrics: finalTranslation,
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

// Papago API를 사용한 기본 번역
async function translateParagraph(text, type) {
    try {
        // 언어 감지
        const detectResponse = await fetch('https://openapi.naver.com/v1/papago/detectLangs', {
            method: 'POST',
            headers: {
                'X-Naver-Client-Id': process.env.PAPAGO_CLIENT_ID,
                'X-Naver-Client-Secret': process.env.PAPAGO_CLIENT_SECRET,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `query=${encodeURIComponent(text)}`
        });

        const detectData = await detectResponse.json();
        const sourceLang = detectData.langCode || 'en';

        // 번역
        const translateResponse = await fetch('https://openapi.naver.com/v1/papago/n2mt', {
            method: 'POST',
            headers: {
                'X-Naver-Client-Id': process.env.PAPAGO_CLIENT_ID,
                'X-Naver-Client-Secret': process.env.PAPAGO_CLIENT_SECRET,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `source=${sourceLang}&target=ko&text=${encodeURIComponent(text)}`
        });

        if (!translateResponse.ok) {
            throw new Error(`Papago API error: ${translateResponse.status}`);
        }

        const translateData = await translateResponse.json();
        return translateData.message.result.translatedText;
    } catch (error) {
        console.error('Papago translation error:', error);
        // 에러 시 원문 반환
        return text;
    }
}

// 문화적 맥락 추가
async function culturalAdaptation(translation, original) {
    // 여기서 문화적 맥락을 추가
    // 예: 서구 문화 표현을 한국 문화로 치환
    const culturalNotes = `\n\n[문화적 맥락 해석]\n`;
    
    // 특정 표현들을 찾아서 설명 추가
    if (original.toLowerCase().includes('american dream')) {
        translation += culturalNotes + '• "American Dream"은 한국의 "개천에서 용 난다"와 유사한 의미';
    }
    if (original.toLowerCase().includes('hood')) {
        translation += culturalNotes + '• "Hood"는 한국의 "동네", "우리 구역" 정도의 의미';
    }
    
    return translation;
}

// 힙합 특화 해석
async function hiphopAdaptation(translation, original) {
    // 힙합 용어와 슬랭 설명 추가
    const hiphopNotes = `\n\n[힙합 문화 해석]\n`;
    let notes = [];
    
    // 힙합 슬랭 감지 및 설명
    const slangMap = {
        'drip': '스타일, 패션 감각',
        'cap': '거짓말',
        'no cap': '진짜, 거짓말 아님',
        'bars': '랩 가사, 라임',
        'heat': '핫한 음악, 명곡',
        'beef': '디스, 갈등',
        'clout': '영향력, 인기',
        'flex': '자랑하다, 과시하다',
        'goat': 'Greatest Of All Time (역대 최고)',
        'lit': '신나는, 재밌는',
        'savage': '거침없는, 독한',
        'salty': '짜증난, 질투하는',
        'woke': '깨어있는, 의식있는',
        'gucci': '좋은, 괜찮은',
        'bet': '알겠어, 오케이',
        'fam': '가족, 친구들',
        'squad': '크루, 친구들',
        'homie': '친구, 형제',
        'hustle': '열심히 일하다, 돈 벌다',
        'grind': '열심히 노력하다',
        'bread': '돈',
        'bands': '큰 돈',
        'ice': '보석, 다이아몬드',
        'whip': '차, 자동차',
        'crib': '집',
        'plug': '연결책, 공급자',
        'finesse': '능숙하게 처리하다',
        'vibe': '분위기, 느낌',
        'mood': '기분, 상태',
        'stan': '열렬한 팬이 되다',
        'ghost': '잠수타다, 연락 끊다',
        'throw shade': '디스하다, 욕하다',
        'spill tea': '험담하다, 비밀을 말하다',
        'slay': '완벽하게 해내다',
        'fire': '멋진, 최고의',
        'dope': '멋진, 쩌는',
        'sick': '대박인, 미친',
        'tight': '멋진, 가까운',
        'real talk': '진심으로, 진짜로',
        'on god': '신께 맹세코',
        'deadass': '진짜로, 정말로',
        'lowkey': '은근히, 살짝',
        'highkey': '대놓고, 확실히'
    };
    
    const lowerOriginal = original.toLowerCase();
    for (const [slang, meaning] of Object.entries(slangMap)) {
        if (lowerOriginal.includes(slang)) {
            notes.push(`• "${slang}" = ${meaning}`);
        }
    }
    
    if (notes.length > 0) {
        translation += hiphopNotes + notes.join('\n');
    }
    
    // 라임 구조 분석
    if (original.includes('\n')) {
        translation += `\n\n[라임 구조]\n`;
        translation += `• 이 곡은 특유의 라임 패턴과 플로우를 가지고 있습니다`;
    }
    
    return translation;
}

// 의미 해석 생성 함수들
function generateDirectMeaning(song, artist, lyrics) {
    return `"${song}"은 ${artist}의 곡으로, 가사를 직역하면 위와 같은 의미를 담고 있습니다. 이 곡은 원문 그대로의 의미를 전달하며, 각 단어와 문장이 직접적으로 전달하고자 하는 메시지를 담고 있습니다.`;
}

function generateCulturalMeaning(song, artist, lyrics) {
    return `"${song}"은 ${artist}의 곡으로, 문화적 맥락을 고려하여 해석하면 서구 문화의 특정 표현들이 한국 문화에 맞게 재해석될 수 있습니다. 이 곡에서 나타나는 문화적 차이와 공통점을 이해하면 더 깊은 의미를 파악할 수 있습니다.`;
}

function generateHiphopMeaning(song, artist, lyrics) {
    const themes = [];
    const lowerLyrics = lyrics.toLowerCase();
    
    // 주제 분석
    if (lowerLyrics.includes('money') || lowerLyrics.includes('cash') || lowerLyrics.includes('bread')) {
        themes.push('부와 성공');
    }
    if (lowerLyrics.includes('love') || lowerLyrics.includes('heart')) {
        themes.push('사랑과 관계');
    }
    if (lowerLyrics.includes('struggle') || lowerLyrics.includes('pain')) {
        themes.push('고난과 극복');
    }
    if (lowerLyrics.includes('dream') || lowerLyrics.includes('goal')) {
        themes.push('꿈과 목표');
    }
    if (lowerLyrics.includes('street') || lowerLyrics.includes('hood')) {
        themes.push('거리 문화');
    }
    if (lowerLyrics.includes('real') || lowerLyrics.includes('fake')) {
        themes.push('진정성');
    }
    
    const themeText = themes.length > 0 ? `주요 테마: ${themes.join(', ')}. ` : '';
    
    return `"${song}"은 ${artist}의 힙합 트랙으로, 힙합 문화의 관점에서 해석하면 다층적인 의미를 담고 있습니다. ${themeText}이 곡은 슬랭, 은유, 더블 엔텐드레(이중적 의미), 그리고 힙합 특유의 스토리텔링 기법을 사용하여 아티스트의 경험과 메시지를 전달합니다. 라임과 플로우는 단순한 음악적 요소를 넘어 의미 전달의 중요한 수단으로 작용합니다.`;
}