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

        // LibreTranslate API 사용 (무료)
        const translatedText = await translateWithLibre(lyrics);
        
        // 번역 타입에 따른 후처리
        let finalTranslation = '';
        let songMeaning = '';
        
        switch (type) {
            case 'direct':
                finalTranslation = `[직역]\n\n${translatedText}`;
                songMeaning = `"${song}"의 직역입니다. 원문의 의미를 그대로 전달하려고 했습니다.`;
                break;
                
            case 'cultural':
                finalTranslation = `[의역 - 문화적 맥락]\n\n${translatedText}`;
                finalTranslation += await addCulturalContext(lyrics, translatedText);
                songMeaning = `"${song}"을 한국 문화 맥락에서 이해할 수 있도록 의역했습니다.`;
                break;
                
            case 'hiphop':
                finalTranslation = `[힙합 특화 해석]\n\n${translatedText}`;
                finalTranslation += await addHiphopContext(lyrics, translatedText);
                songMeaning = generateHiphopAnalysis(song, artist, lyrics);
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

// LibreTranslate API 호출
async function translateWithLibre(text) {
    try {
        const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: text,
                source: 'en',
                target: 'ko',
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error('LibreTranslate API error');
        }
        
        const data = await response.json();
        return data.translatedText;
    } catch (error) {
        console.error('LibreTranslate error:', error);
        // 에러 시 기본 번역 제공
        return `[자동 번역 실패]\n\n원문:\n${text}\n\n(번역 서비스 연결 오류)`;
    }
}

// 문화적 맥락 추가
async function addCulturalContext(original, translated) {
    const contexts = [];
    const lowerOriginal = original.toLowerCase();
    
    // 문화적 표현 매핑
    const culturalMap = {
        'american dream': '아메리칸 드림 - 한국의 "개천에서 용 난다"와 유사',
        'from rags to riches': '무일푼에서 부자로 - 한국의 "흙수저에서 금수저로"',
        'hood': '동네, 우리 구역 - 한국의 "우리 동네"',
        'block': '거리, 구역 - 한국의 "골목"',
        'hustle': '열심히 일하다 - 한국의 "뼈빠지게 일하다"',
        'grind': '노력하다 - 한국의 "갈아 넣다"',
        'broke': '빈털터리 - 한국의 "쪽박"',
        'made it': '성공했다 - 한국의 "대박났다"',
        'real ones': '진짜 친구들 - 한국의 "찐친"',
        'day ones': '처음부터 함께한 사람들 - 한국의 "조기축구회 멤버"'
    };
    
    for (const [eng, kor] of Object.entries(culturalMap)) {
        if (lowerOriginal.includes(eng)) {
            contexts.push(`• "${eng}" → ${kor}`);
        }
    }
    
    if (contexts.length > 0) {
        return `\n\n[문화적 맥락 설명]\n${contexts.join('\n')}`;
    }
    
    return '';
}

// 힙합 맥락 추가
async function addHiphopContext(original, translated) {
    const contexts = [];
    const lowerOriginal = original.toLowerCase();
    
    // 힙합 용어 사전
    const hiphopTerms = {
        // 기본 슬랭
        'drip': '패션, 스타일 (물방울처럼 번쩍이는 보석에서 유래)',
        'cap/no cap': 'cap은 거짓말, no cap은 진짜',
        'bars': '랩 가사의 한 줄, 마디',
        'flow': '랩의 리듬과 박자감',
        'beat': '비트, 반주',
        'hook': '후렴구',
        'verse': '벌스, 랩 파트',
        
        // 돈 관련
        'racks': '큰 돈 (보통 1000달러 단위)',
        'bands': '돈뭉치 (고무줄로 묶은)',
        'bag': '큰 돈, 수익',
        'bread': '돈 (빵처럼 필수품이란 의미)',
        'cheese': '돈 (치즈처럼 노란색)',
        'paper': '지폐, 돈',
        
        // 보석/패션
        'ice': '다이아몬드, 보석',
        'bust down': '다이아몬드로 덮인',
        'drip': '비싼 패션, 스타일',
        'fit': '옷차림, 패션',
        'fresh': '멋진, 새로운',
        
        // 라이프스타일
        'whip': '차, 자동차',
        'crib': '집',
        'trap': '마약 거래 장소, 또는 힙합 장르',
        'plug': '연결책, 공급자',
        'finesse': '능숙하게 처리하다',
        
        // 관계/태도
        'beef': '갈등, 디스전',
        'diss': '디스, 욕하다',
        'clout': '영향력, 명성',
        'flex': '자랑하다, 과시하다',
        'ghost': '잠수타다',
        'salty': '짜증난, 질투하는',
        
        // 긍정 표현
        'lit': '신나는, 최고의',
        'fire': '대박인, 멋진',
        'dope': '멋진, 쩌는',
        'sick': '미친듯이 좋은',
        'goat': 'Greatest Of All Time (역대 최고)',
        
        // 기타
        'real talk': '진짜로, 진심으로',
        'on god': '신께 맹세코',
        'deadass': '정말로, 진짜로',
        'lowkey/highkey': '은근히/대놓고',
        'fam/homie': '친구, 형제',
        'squad': '크루, 친구들'
    };
    
    // 슬랭 감지 및 설명
    for (const [term, meaning] of Object.entries(hiphopTerms)) {
        if (lowerOriginal.includes(term)) {
            contexts.push(`• "${term}" = ${meaning}`);
        }
    }
    
    // 라임 분석
    const lines = original.split('\n').filter(line => line.trim());
    const rhymePatterns = [];
    
    // 간단한 라임 감지 (라인 끝 단어)
    if (lines.length > 2) {
        for (let i = 0; i < lines.length - 1; i++) {
            const words1 = lines[i].trim().split(' ');
            const words2 = lines[i + 1].trim().split(' ');
            if (words1.length > 0 && words2.length > 0) {
                const lastWord1 = words1[words1.length - 1].toLowerCase().replace(/[^a-z]/g, '');
                const lastWord2 = words2[words2.length - 1].toLowerCase().replace(/[^a-z]/g, '');
                
                if (lastWord1.slice(-2) === lastWord2.slice(-2) && lastWord1 !== lastWord2) {
                    rhymePatterns.push(`"${lastWord1}" - "${lastWord2}"`);
                }
            }
        }
    }
    
    let result = '';
    
    if (contexts.length > 0) {
        result += `\n\n[힙합 용어 해설]\n${contexts.join('\n')}`;
    }
    
    if (rhymePatterns.length > 0) {
        result += `\n\n[라임 패턴]\n${rhymePatterns.slice(0, 5).join(', ')} 등`;
    }
    
    return result;
}

// 힙합 분석 생성
function generateHiphopAnalysis(song, artist, lyrics) {
    const themes = [];
    const lowerLyrics = lyrics.toLowerCase();
    
    // 주제 분석
    const themeKeywords = {
        '부와 성공': ['money', 'cash', 'bread', 'rich', 'wealth', 'million', 'racks', 'bands'],
        '사랑과 관계': ['love', 'heart', 'girl', 'woman', 'relationship', 'feelings'],
        '고난과 극복': ['struggle', 'pain', 'hard', 'difficult', 'overcome', 'survive'],
        '꿈과 목표': ['dream', 'goal', 'ambition', 'future', 'success', 'make it'],
        '거리 문화': ['street', 'hood', 'block', 'ghetto', 'trap', 'corner'],
        '진정성': ['real', 'fake', 'authentic', 'genuine', 'truth', 'honest'],
        '파티와 즐거움': ['party', 'club', 'dance', 'drink', 'fun', 'turn up'],
        '명성과 인기': ['fame', 'famous', 'star', 'clout', 'popular', 'known']
    };
    
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
        if (keywords.some(keyword => lowerLyrics.includes(keyword))) {
            themes.push(theme);
        }
    }
    
    const themeText = themes.length > 0 ? `\n\n주요 테마: ${themes.join(', ')}` : '';
    
    return `"${song}"은 ${artist}의 힙합 트랙으로, 현대 힙합 문화의 다양한 요소들을 담고 있습니다.${themeText}

이 곡의 특징:
• 슬랭과 은유: 힙합 특유의 언어유희와 이중적 의미
• 라임과 플로우: 한국어로는 전달하기 어려운 영어 라임의 묘미
• 문화적 배경: 미국 힙합 문화에서 비롯된 표현들
• 스토리텔링: 개인의 경험과 감정을 음악으로 표현

힙합은 단순한 음악 장르를 넘어 하나의 문화이자 표현 방식입니다. 이 곡을 완전히 이해하려면 가사뿐만 아니라 비트, 플로우, 그리고 아티스트의 배경까지 고려해야 합니다.`;
}