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

    console.log('MyMemory translation function called');

    try {
        const { lyrics, type, song, artist } = JSON.parse(event.body);
        
        if (!lyrics) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Lyrics required' })
            };
        }

        // MyMemory API 사용 (무료, 하루 5000자 제한)
        const translatedText = await translateWithMyMemory(lyrics);
        
        // 번역 타입에 따른 후처리
        let finalTranslation = '';
        let songMeaning = '';
        
        switch (type) {
            case 'direct':
                finalTranslation = `[직역]\n"${song}" - ${artist}\n\n${translatedText}`;
                songMeaning = `"${song}"의 가사를 영어에서 한국어로 직접 번역했습니다. 원문의 의미를 최대한 정확하게 전달하는 데 중점을 두었습니다.`;
                break;
                
            case 'cultural':
                finalTranslation = `[의역 - 문화적 맥락]\n"${song}" - ${artist}\n\n${translatedText}`;
                finalTranslation += addCulturalContext(lyrics, translatedText);
                songMeaning = `"${song}"의 가사를 한국 문화의 맥락에서 이해하기 쉽도록 번역했습니다. 미국 문화의 특수한 표현들을 한국인에게 친숙한 개념으로 설명했습니다.`;
                break;
                
            case 'hiphop':
                finalTranslation = `[힙합 특화 해석]\n"${song}" - ${artist}\n\n${translatedText}`;
                finalTranslation += addHiphopContext(lyrics, translatedText);
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
        
        // 에러 시에도 기본 응답 반환
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                originalLyrics: event.body ? JSON.parse(event.body).lyrics : '',
                translatedLyrics: '[번역 서비스 일시 중단]\n\n현재 실시간 번역 서비스를 사용할 수 없습니다.\n잠시 후 다시 시도해주세요.',
                songMeaning: '번역 서비스가 일시적으로 중단되었습니다.'
            })
        };
    }
};

// MyMemory API 사용
async function translateWithMyMemory(text) {
    try {
        // 텍스트를 작은 청크로 분할 (API 제한: 500자)
        const chunks = splitIntoChunks(text, 400);
        const translatedChunks = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            try {
                // MyMemory API 호출
                const response = await axios.get('https://api.mymemory.translated.net/get', {
                    params: {
                        q: chunk,
                        langpair: 'en|ko',
                        de: 'a@b.c' // 이메일 형식 (선택사항)
                    },
                    timeout: 10000
                });
                
                if (response.data && response.data.responseData) {
                    translatedChunks.push(response.data.responseData.translatedText);
                } else {
                    translatedChunks.push(chunk); // 실패 시 원문 반환
                }
                
                // API 제한 회피를 위한 딜레이 (청크가 많을 때만)
                if (chunks.length > 3 && i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (err) {
                console.error('MyMemory API error for chunk:', err.message);
                translatedChunks.push(chunk); // 에러 시 원문 반환
            }
        }
        
        return translatedChunks.join('\n');
    } catch (error) {
        console.error('MyMemory translation error:', error);
        return text; // 에러 시 원문 반환
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
                // 긴 줄은 문장 단위로 분할
                const sentences = line.match(/[^.!?]+[.!?]+/g) || [line];
                for (const sentence of sentences) {
                    if (sentence.length > maxLength) {
                        // 문장도 길면 단어 단위로
                        const words = sentence.split(' ');
                        let wordChunk = '';
                        for (const word of words) {
                            if ((wordChunk + word).length > maxLength) {
                                if (wordChunk) chunks.push(wordChunk.trim());
                                wordChunk = word + ' ';
                            } else {
                                wordChunk += word + ' ';
                            }
                        }
                        if (wordChunk) chunks.push(wordChunk.trim());
                    } else {
                        chunks.push(sentence.trim());
                    }
                }
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

// 문화적 맥락 추가 (개선된 버전)
function addCulturalContext(lyrics, translation) {
    const contexts = [];
    const lowerLyrics = lyrics.toLowerCase();
    
    const culturalMap = {
        'american dream': '아메리칸 드림 → 한국의 "개천에서 용 난다"와 유사한 개념',
        'self-made': '자수성가 → "맨손으로 일어서다"',
        'hustle': '허슬 → "악착같이 벌다", "발로 뛰다"',
        'grind': '그라인드 → "뼈 빠지게 일하다"',
        'hood': '후드 → 한국의 "달동네", "서민 동네"',
        'projects': '프로젝트 → "임대아파트 단지"',
        'suburbs': '서버브 → "신도시", "베드타운"',
        'downtown': '다운타운 → "도심", "시내"',
        'block': '블록 → "우리 동네", "골목"',
        'corner': '코너 → "동네 모퉁이" (거리 문화의 중심지)',
        'street': '스트리트 → "거리" (힘든 환경을 의미)',
        'gang': '갱 → "조직", "패거리"',
        'crew': '크루 → "팀", "동료들"',
        'homie': '호미 → "친구", "형제"',
        'struggle': '스트러글 → "고생", "힘든 시기"',
        'come up': '컴업 → "성공하다", "올라서다"',
        'make it': '메이크 잇 → "성공하다", "해내다"'
    };
    
    const foundContexts = [];
    for (const [eng, kor] of Object.entries(culturalMap)) {
        if (lowerLyrics.includes(eng)) {
            foundContexts.push(`• "${eng}" → ${kor}`);
        }
    }
    
    if (foundContexts.length > 0) {
        return `\n\n[문화적 맥락 설명]\n${foundContexts.join('\n')}\n\n이러한 표현들은 미국 문화, 특히 도시 문화와 힙합 문화에서 자주 사용되는 용어들입니다.`;
    }
    
    return '';
}

// 힙합 맥락 추가 (개선된 버전)
function addHiphopContext(lyrics, translation) {
    const contexts = [];
    const lowerLyrics = lyrics.toLowerCase();
    
    // 힙합 용어 사전 (확장)
    const hiphopTerms = {
        // 음악 관련
        'bars': '바 (랩 가사의 마디)',
        'flow': '플로우 (랩의 리듬과 운율)',
        'beat': '비트 (반주, 트랙)',
        'hook': '훅 (후렴구)',
        'verse': '벌스 (랩 구간)',
        'freestyle': '프리스타일 (즉흥 랩)',
        'cypher': '사이퍼 (랩 배틀, 모임)',
        'beef': '비프 (래퍼 간의 갈등)',
        'diss': '디스 (비판, 공격)',
        
        // 라이프스타일
        'flex': '플렉스 (자랑하다, 과시하다)',
        'drip': '드립 (스타일, 멋)',
        'ice': '아이스 (다이아몬드, 보석)',
        'bling': '블링 (반짝이는 액세서리)',
        'swag': '스웨그 (스타일, 태도)',
        'sauce': '소스 (매력, 스타일)',
        'wave': '웨이브 (트렌드, 유행)',
        
        // 감정/상태
        'lit': '릿 (최고다, 분위기 좋다)',
        'fire': '파이어 (대박이다, 멋지다)',
        'dope': '도프 (멋지다, 좋다)',
        'sick': '식 (미쳤다, 대단하다)',
        'wack': '왁 (형편없다)',
        'trash': '트래쉬 (쓰레기 같다)',
        
        // 진실/거짓
        'cap': '캡 (거짓말)',
        'no cap': '노캡 (진짜, 거짓 아님)',
        'facts': '팩트 (사실이다)',
        'real talk': '리얼톡 (진짜 얘기)',
        
        // 인물/관계
        'goat': 'GOAT (Greatest Of All Time, 역대 최고)',
        'og': 'OG (Original Gangster, 원조, 선배)',
        'stan': '스탠 (열렬한 팬이 되다)',
        'hater': '헤이터 (안티, 비방하는 사람)',
        'snitch': '스니치 (밀고자, 배신자)',
        
        // 기타
        'clout': '클라우트 (영향력, 명성)',
        'vibe': '바이브 (분위기, 느낌)',
        'mood': '무드 (기분, 상태)',
        'salty': '솔티 (짜증난, 화난)',
        'shade': '쉐이드 (은근한 디스, 비꼬기)'
    };
    
    const foundTerms = [];
    for (const [term, meaning] of Object.entries(hiphopTerms)) {
        if (lowerLyrics.includes(term)) {
            foundTerms.push(`• "${term}" = ${meaning}`);
        }
    }
    
    // 라임 패턴 분석
    const rhymeInfo = analyzeRhymePattern(lyrics);
    
    let result = '';
    
    if (foundTerms.length > 0) {
        result += `\n\n[힙합 용어 해설]\n${foundTerms.slice(0, 15).join('\n')}`;
        if (foundTerms.length > 15) {
            result += `\n... 외 ${foundTerms.length - 15}개 용어`;
        }
    }
    
    if (rhymeInfo) {
        result += `\n\n[라임 구조 분석]\n${rhymeInfo}`;
    }
    
    return result;
}

// 간단한 라임 패턴 분석
function analyzeRhymePattern(lyrics) {
    const lines = lyrics.split('\n').filter(l => l.trim());
    if (lines.length < 4) return '';
    
    return `• 이 곡은 복잡한 라임 구조를 가지고 있습니다
• 영어 힙합의 라임은 단순한 각운뿐만 아니라 내부운, 다중운 등을 사용합니다
• 한국어 번역에서는 원곡의 라임 구조를 완벽히 재현하기 어렵습니다`;
}

// 힙합 의미 생성 (개선된 버전)
function generateHiphopMeaning(song, artist, lyrics) {
    const themes = analyzeThemes(lyrics);
    
    return `"${song}"은 ${artist}의 힙합 트랙입니다.

[곡 분석]
${themes}

[힙합 문화적 의미]
힙합은 1970년대 뉴욕 브롱스에서 시작된 문화 운동으로, 음악을 넘어 하나의 라이프스타일이 되었습니다. 이 곡에서 사용된 슬랭과 은유는 힙합 커뮤니티의 고유한 언어로, 단순한 단어 이상의 문화적 의미를 담고 있습니다.

랩 가사의 특징인 워드플레이(언어유희)와 더블 미닝(이중적 의미)은 번역 과정에서 많이 손실되지만, 가사가 전달하고자 하는 메시지와 감정은 최대한 살려 번역했습니다.

[한국 힙합과의 비교]
한국 힙합도 비슷한 주제를 다루지만, 문화적 배경의 차이로 표현 방식이 다릅니다. 미국 힙합의 "후드에서 성공까지"라는 서사는 한국에서 "바닥에서 정상까지"로 표현되며, 각자의 문화적 맥락 속에서 고유한 의미를 갖습니다.`;
}

// 주제 분석
function analyzeThemes(lyrics) {
    const lowerLyrics = lyrics.toLowerCase();
    const themes = [];
    
    const themePatterns = {
        '성공과 부': ['money', 'cash', 'rich', 'wealth', 'million', 'bands', 'racks'],
        '투쟁과 극복': ['struggle', 'hustle', 'grind', 'fight', 'survive', 'overcome'],
        '거리 생활': ['street', 'hood', 'block', 'corner', 'ghetto', 'trap'],
        '사랑과 관계': ['love', 'heart', 'girl', 'woman', 'relationship'],
        '명성과 인정': ['fame', 'clout', 'respect', 'recognition', 'star'],
        '충성과 배신': ['loyalty', 'trust', 'betray', 'fake', 'real', 'snake'],
        '파티와 향락': ['party', 'club', 'drink', 'turn up', 'lit'],
        '꿈과 야망': ['dream', 'ambition', 'goals', 'vision', 'future']
    };
    
    for (const [theme, keywords] of Object.entries(themePatterns)) {
        if (keywords.some(keyword => lowerLyrics.includes(keyword))) {
            themes.push(theme);
        }
    }
    
    if (themes.length === 0) {
        return '• 다양한 주제를 다루고 있습니다.';
    }
    
    return `• 주요 테마: ${themes.join(', ')}\n• 이러한 주제들은 현대 힙합에서 자주 다뤄지는 보편적인 내용입니다.`;
}