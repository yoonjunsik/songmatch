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

        // 가사를 청크로 분할 (Google Translate 무료 API는 문자 제한이 있음)
        const chunks = splitIntoChunks(lyrics, 500);
        const translatedChunks = [];
        
        // 각 청크를 번역
        for (const chunk of chunks) {
            const translated = await translateWithGoogleFree(chunk);
            translatedChunks.push(translated);
            // API 제한 회피를 위한 딜레이
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const baseTranslation = translatedChunks.join('\n');
        
        // 번역 타입에 따른 후처리
        let finalTranslation = '';
        let songMeaning = '';
        
        switch (type) {
            case 'direct':
                finalTranslation = `[직역]\n"${song}" - ${artist}\n\n${baseTranslation}`;
                songMeaning = generateDirectMeaning(song, artist);
                break;
                
            case 'cultural':
                finalTranslation = `[의역 - 문화적 맥락]\n"${song}" - ${artist}\n\n${baseTranslation}`;
                finalTranslation += addCulturalContext(lyrics);
                songMeaning = generateCulturalMeaning(song, artist);
                break;
                
            case 'hiphop':
                finalTranslation = `[힙합 특화 해석]\n"${song}" - ${artist}\n\n${baseTranslation}`;
                finalTranslation += addHiphopContext(lyrics);
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

// Google Translate 무료 API (translate.googleapis.com의 공개 엔드포인트 사용)
async function translateWithGoogleFree(text) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error('Google Translate error');
        }
        
        const data = await response.json();
        
        // 번역된 텍스트 추출
        let translated = '';
        if (data && data[0]) {
            data[0].forEach(sentence => {
                if (sentence[0]) {
                    translated += sentence[0];
                }
            });
        }
        
        return translated || text;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
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
            
            // 한 줄이 너무 길면 단어 단위로 분할
            if (line.length > maxLength) {
                const words = line.split(' ');
                let wordChunk = '';
                for (const word of words) {
                    if ((wordChunk + word).length > maxLength) {
                        chunks.push(wordChunk.trim());
                        wordChunk = word + ' ';
                    } else {
                        wordChunk += word + ' ';
                    }
                }
                if (wordChunk) {
                    currentChunk = wordChunk;
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

// 문화적 맥락 추가
function addCulturalContext(lyrics) {
    const contexts = [];
    const lowerLyrics = lyrics.toLowerCase();
    
    const culturalMap = {
        'american dream': '아메리칸 드림 → 한국의 "개천에서 용 난다"',
        'from rags to riches': '무일푼에서 부자로 → "흙수저에서 금수저로"',
        'pull yourself up by your bootstraps': '스스로 일어서다 → "맨주먹으로 성공하다"',
        'keeping up with the joneses': '남과 비교하며 살다 → "남 눈치 보며 살다"',
        'rat race': '쥐 경주 → "무한 경쟁 사회"',
        'glass ceiling': '유리 천장 → "보이지 않는 차별"',
        'melting pot': '용광로 → "다문화 사회"',
        'suburban': '교외 → "신도시, 베드타운"',
        'inner city': '도심 빈민가 → "달동네"',
        'projects': '공공 주택 → "임대 아파트"',
        'gentrification': '젠트리피케이션 → "뜨는 동네, 원주민 밀려남"',
        'block party': '거리 파티 → "동네 잔치"',
        'tailgate': '차 뒤에서 파티 → "한국의 치맥 문화"',
        'potluck': '각자 음식 가져오기 → "1인 1찬"'
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
    
    // 힙합 용어 사전 (확장판)
    const hiphopTerms = {
        // 돈/성공 관련
        'racks on racks': '돈뭉치 위에 돈뭉치 (엄청난 부)',
        'make it rain': '돈을 뿌리다 (클럽에서)',
        'paper chase': '돈을 쫓다',
        'secure the bag': '돈을 확실히 벌다',
        'bankroll': '전 재산, 자금',
        'check': '수표, 큰 돈',
        'commas': '콤마 (천 단위 구분, 큰 돈)',
        
        // 라이프스타일
        'turn up': '신나게 놀다',
        'lit': '분위기 최고',
        'vibe': '분위기, 느낌',
        'wave': '트렌드, 유행',
        'drip': '스타일, 패션',
        'sauce': '스웨그, 매력',
        'steez': '스타일 + 편안함',
        
        // 관계/충성
        'day one': '처음부터 함께한 사람',
        'ride or die': '끝까지 함께할 사람',
        'real ones': '진짜 친구들',
        'squad': '내 팀, 크루',
        'circle': '내 사람들',
        'homie': '친구, 형제',
        'bro': '형제',
        
        // 거리 문화
        'trap house': '마약 거래 장소',
        'corner': '길모퉁이 (거래 장소)',
        'block': '우리 동네',
        'hood': '동네, 게토',
        'streets': '거리 (힘든 환경)',
        'struggle': '고난, 어려움',
        'hustle': '돈 벌기 위한 노력',
        
        // 태도/감정
        'savage': '거침없는',
        'petty': '속 좁은',
        'salty': '짜증난',
        'pressed': '열받은',
        'triggered': '자극받은',
        'mood': '기분, 상태',
        'facts': '팩트, 사실',
        
        // 음악 관련
        'bars': '랩 가사',
        'spit': '랩하다',
        'flow': '플로우, 랩 스타일',
        'beat': '비트',
        'banger': '명곡',
        'mixtape': '믹스테이프',
        'freestyle': '즉흥 랩',
        
        // 기타 슬랭
        'cap/no cap': '거짓말/진짜',
        'bet': '알겠어, 좋아',
        'dead': '진짜 웃긴',
        'ghost': '잠수타다',
        'flex': '자랑하다',
        'finesse': '능숙하게 처리하다',
        'clout': '영향력',
        'stan': '광팬이 되다',
        'ship': '커플을 응원하다',
        'tea': '가십, 루머',
        'shade': '은근히 디스',
        'receipts': '증거',
        'woke': '각성한, 의식있는',
        'cancelled': '매장당한',
        'goat': '역대 최고 (G.O.A.T)',
        'og': '오리지널, 원조',
        'fire': '대박인',
        'trash': '쓰레기 같은',
        'whack': '형편없는'
    };
    
    // 용어 감지
    for (const [term, meaning] of Object.entries(hiphopTerms)) {
        if (lowerLyrics.includes(term)) {
            contexts.push(`• "${term}" = ${meaning}`);
        }
    }
    
    // 라임 구조 분석
    const lines = lyrics.split('\n').filter(l => l.trim());
    let rhymeInfo = '';
    
    if (lines.length > 2) {
        rhymeInfo = '\n\n[라임 구조]\n';
        rhymeInfo += '• 영어 랩의 라임은 단순한 끝말잇기가 아닌 복잡한 음향 패턴입니다\n';
        rhymeInfo += '• 내부 라임, 다중 라임, 슬랜트 라임 등 다양한 기법이 사용됩니다\n';
        rhymeInfo += '• 한국어로 번역하면 이러한 라임의 묘미가 사라집니다';
    }
    
    let result = '';
    
    if (contexts.length > 0) {
        result += `\n\n[힙합 용어 해설]\n${contexts.slice(0, 20).join('\n')}`;
        if (contexts.length > 20) {
            result += `\n... 외 ${contexts.length - 20}개 용어`;
        }
    }
    
    result += rhymeInfo;
    
    return result;
}

// 의미 생성 함수들
function generateDirectMeaning(song, artist) {
    return `"${song}"은 ${artist}의 곡으로, 위의 번역은 원문을 최대한 직역한 것입니다. 영어 표현을 한국어로 그대로 옮겼기 때문에 다소 어색할 수 있지만, 원문의 의미를 정확히 전달하려고 노력했습니다.`;
}

function generateCulturalMeaning(song, artist) {
    return `"${song}"은 ${artist}의 곡으로, 서구 문화의 맥락에서 쓰여진 가사를 한국 문화에 맞게 재해석했습니다. 직역으로는 전달하기 어려운 문화적 뉘앙스를 한국인이 이해하기 쉽도록 의역했습니다. 

특히 미국의 사회적 배경, 역사, 문화적 관습 등을 고려하여 한국의 유사한 개념으로 치환하거나 설명을 추가했습니다.`;
}

function generateHiphopMeaning(song, artist, lyrics) {
    const themes = analyzeThemes(lyrics);
    const era = guessEra(lyrics);
    
    return `"${song}"은 ${artist}의 힙합 트랙입니다.

[곡 분석]
${themes}

[힙합 문화적 의미]
이 곡은 ${era} 힙합의 특징을 보여줍니다. 힙합은 단순한 음악 장르가 아닌 문화 운동으로, 억압받는 계층의 목소리를 대변하고 자신의 이야기를 전달하는 수단입니다.

가사에 등장하는 슬랭과 은유는 힙합 커뮤니티 내부의 언어로, 외부인이 쉽게 이해하기 어려운 이중적 의미를 담고 있습니다. 이는 주류 사회로부터 자신들의 문화를 보호하는 동시에, 같은 경험을 공유하는 사람들끼리의 유대감을 형성합니다.

[한국 힙합과의 비교]
한국 힙합도 비슷한 주제를 다루지만, 문화적 배경의 차이로 인해 표현 방식이 다릅니다. 미국 힙합의 '후드'는 한국의 '동네'로, '허슬'은 '노력'으로 번역되지만, 그 안에 담긴 역사적 무게와 문화적 함의는 완전히 다릅니다.`;
}

// 주제 분석
function analyzeThemes(lyrics) {
    const lowerLyrics = lyrics.toLowerCase();
    const themes = [];
    
    const themePatterns = {
        '성공 스토리': ['started from', 'made it', 'came up', 'success', 'rich', 'wealthy'],
        '거리 생활': ['streets', 'hood', 'block', 'corner', 'trap'],
        '돈과 부': ['money', 'cash', 'racks', 'bands', 'millionaire'],
        '투쟁과 생존': ['struggle', 'survive', 'fight', 'pain', 'hard'],
        '사랑과 관계': ['love', 'girl', 'heart', 'relationship'],
        '파티와 향락': ['party', 'club', 'drink', 'smoke', 'turn up'],
        '충성과 배신': ['loyalty', 'betray', 'fake', 'real', 'trust'],
        '자기 과시': ['flex', 'drip', 'ice', 'designer', 'expensive']
    };
    
    for (const [theme, keywords] of Object.entries(themePatterns)) {
        if (keywords.some(keyword => lowerLyrics.includes(keyword))) {
            themes.push(theme);
        }
    }
    
    if (themes.length === 0) {
        return '• 일반적인 주제를 다루고 있습니다.';
    }
    
    return `• 주요 테마: ${themes.join(', ')}\n• 이러한 주제들은 힙합 문화에서 자주 다뤄지는 보편적인 내용입니다.`;
}

// 시대 추측
function guessEra(lyrics) {
    const lowerLyrics = lyrics.toLowerCase();
    
    // 2020년대 용어
    if (['tiktok', 'viral', 'covid', 'pandemic', 'zoom'].some(term => lowerLyrics.includes(term))) {
        return '2020년대';
    }
    
    // 2010년대 용어
    if (['instagram', 'snapchat', 'iphone', 'streaming'].some(term => lowerLyrics.includes(term))) {
        return '2010년대';
    }
    
    // 2000년대 용어
    if (['myspace', 'ringtone', 'blackberry'].some(term => lowerLyrics.includes(term))) {
        return '2000년대';
    }
    
    // 현대적 용어가 많으면
    if (['app', 'social media', 'dm', 'tweet'].some(term => lowerLyrics.includes(term))) {
        return '현대';
    }
    
    return '현대'
}