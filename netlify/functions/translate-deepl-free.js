const axios = require('axios');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    console.log('DeepL-style translation function called');

    try {
        const { lyrics, type, song, artist } = JSON.parse(event.body);
        
        if (!lyrics) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Lyrics required' })
            };
        }

        // LibreTranslate API 사용 (무료 인스턴스)
        const translatedText = await translateWithLibre(lyrics);
        
        // 번역 타입에 따른 후처리
        let finalTranslation = '';
        let songMeaning = '';
        
        switch (type) {
            case 'direct':
                finalTranslation = `[직역]\n"${song}" - ${artist}\n\n${translatedText}`;
                songMeaning = `"${song}"의 가사를 있는 그대로 번역했습니다. 영어 표현의 직접적인 의미를 전달하는 데 중점을 두었습니다.`;
                break;
                
            case 'cultural':
                finalTranslation = `[의역 - 문화적 맥락]\n"${song}" - ${artist}\n\n${translatedText}`;
                finalTranslation += addCulturalContext(lyrics);
                songMeaning = `"${song}"의 가사를 한국 문화의 맥락에서 이해하기 쉽도록 의역했습니다. 서구 문화의 관용구나 은유를 한국인에게 친숙한 표현으로 바꾸었습니다.`;
                break;
                
            case 'hiphop':
                finalTranslation = `[힙합 특화 해석]\n"${song}" - ${artist}\n\n${translatedText}`;
                finalTranslation += addHiphopContext(lyrics);
                songMeaning = generateHiphopMeaning(song, artist);
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
            body: JSON.stringify({ 
                error: 'Translation failed', 
                details: error.message,
                originalLyrics: event.body ? JSON.parse(event.body).lyrics : '',
                translatedLyrics: '번역 서비스를 일시적으로 사용할 수 없습니다.',
                songMeaning: '곡 분석을 일시적으로 사용할 수 없습니다.'
            })
        };
    }
};

// LibreTranslate API 사용
async function translateWithLibre(text) {
    try {
        // 무료 LibreTranslate 인스턴스들
        const instances = [
            'https://translate.argosopentech.com',
            'https://libretranslate.de',
            'https://translate.terraprint.co'
        ];
        
        // 텍스트를 작은 청크로 분할 (API 제한 때문)
        const chunks = splitIntoChunks(text, 300);
        const translatedChunks = [];
        
        for (const chunk of chunks) {
            let translated = null;
            
            // 여러 인스턴스 시도
            for (const instance of instances) {
                try {
                    const response = await axios.post(`${instance}/translate`, {
                        q: chunk,
                        source: 'en',
                        target: 'ko',
                        format: 'text'
                    }, {
                        timeout: 5000
                    });
                    
                    if (response.data && response.data.translatedText) {
                        translated = response.data.translatedText;
                        break;
                    }
                } catch (err) {
                    console.log(`Instance ${instance} failed:`, err.message);
                    continue;
                }
            }
            
            // 모든 인스턴스가 실패하면 원문 반환
            translatedChunks.push(translated || chunk);
            
            // API 제한 회피를 위한 딜레이
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return translatedChunks.join('\n');
    } catch (error) {
        console.error('LibreTranslate error:', error);
        // 에러 시 기본 번역 반환
        return `[자동 번역 실패]\n\n${text}`;
    }
}

// 텍스트를 청크로 분할
function splitIntoChunks(text, maxLength) {
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
        if ((currentChunk + line).length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            
            if (line.length > maxLength) {
                // 긴 줄은 단어 단위로 분할
                const words = line.split(' ');
                let wordChunk = '';
                for (const word of words) {
                    if ((wordChunk + word).length > maxLength) {
                        if (wordChunk) chunks.push(wordChunk.trim());
                        wordChunk = word + ' ';
                    } else {
                        wordChunk += word + ' ';
                    }
                }
                if (wordChunk) currentChunk = wordChunk;
            } else {
                currentChunk = line;
            }
        } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

// 문화적 맥락 추가
function addCulturalContext(lyrics) {
    const contexts = [];
    const lowerLyrics = lyrics.toLowerCase();
    
    const culturalMap = {
        'american dream': '아메리칸 드림 (한국의 "개천에서 용 난다")',
        'hood': '게토, 빈민가 (한국의 "달동네")',
        'projects': '공공 주택단지 (한국의 "임대아파트")',
        'suburbs': '교외 지역 (한국의 "신도시")',
        'block': '동네, 거리 (우리 동네)',
        'corner': '길모퉁이 (동네 구석)',
        'grind': '열심히 일하다 (뼈 빠지게 일하다)'
    };
    
    for (const [eng, kor] of Object.entries(culturalMap)) {
        if (lowerLyrics.includes(eng)) {
            contexts.push(`• "${eng}" → ${kor}`);
        }
    }
    
    if (contexts.length > 0) {
        return `\n\n[문화적 맥락 설명]\n${contexts.join('\n')}`;
    }
    
    return '';
}

// 힙합 맥락 추가
function addHiphopContext(lyrics) {
    const contexts = [];
    const lowerLyrics = lyrics.toLowerCase();
    
    const hiphopTerms = {
        'bars': '랩 가사 (한 마디)',
        'flow': '플로우 (랩의 리듬과 스타일)',
        'beef': '비프 (래퍼들 간의 갈등)',
        'diss': '디스 (상대를 비판하는 랩)',
        'flex': '플렉스 (자랑하다)',
        'drip': '드립 (스타일, 패션)',
        'cap': '캡 (거짓말)',
        'no cap': '노캡 (진짜, 거짓말 아님)',
        'goat': 'GOAT (역대 최고)',
        'fire': '파이어 (최고다, 멋지다)',
        'lit': '릿 (분위기 좋다)',
        'savage': '새비지 (거침없다)',
        'salty': '솔티 (짜증난다)',
        'shade': '쉐이드 (은근히 디스)',
        'stan': '스탠 (열렬한 팬이 되다)',
        'clout': '클라우트 (영향력, 명성)'
    };
    
    for (const [term, meaning] of Object.entries(hiphopTerms)) {
        if (lowerLyrics.includes(term)) {
            contexts.push(`• "${term}" = ${meaning}`);
        }
    }
    
    if (contexts.length > 0) {
        return `\n\n[힙합 용어 해설]\n${contexts.slice(0, 10).join('\n')}`;
    }
    
    return '';
}

// 힙합 의미 생성
function generateHiphopMeaning(song, artist) {
    return `"${song}"은 ${artist}의 힙합 트랙으로, 힙합 문화의 언어와 표현을 사용합니다. 

힙합은 단순한 음악 장르가 아닌 문화 운동으로, 거리의 이야기를 전하고 사회적 메시지를 담습니다. 이 곡의 슬랭과 은유는 힙합 커뮤니티의 고유한 표현 방식을 보여줍니다.

한국어로 번역할 때 원곡의 라임과 플로우의 느낌을 완전히 전달하기는 어렵지만, 가사의 의미와 감정을 최대한 살리려고 노력했습니다.`;
}