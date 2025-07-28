exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    console.log('Demo translation function called');
    
    try {
        const { lyrics, type, song, artist } = JSON.parse(event.body);
        
        // 데모 번역 데이터
        const demoTranslations = {
            'Runaway': {
                direct: `[직역] "Runaway" - Kanye West

도망쳐라 빨리, 빨리 도망쳐라
그리고 난 항상 그녀가 나를 떠날 것을 알고 있었어
(도망쳐) 나에게서 도망쳐라 베이비
이렇게 좋은 사람을 찾을 수 없을 거야

그리고 난 항상 알고 있었어
저쪽에 밝은 빛들이 있다는 걸
그리고 벌금 때문에 그들이 나를 찾을 수도 있어
너를 위해 건배를, 말썽꾸러기들`,
                
                cultural: `[의역 - 문화적 맥락] "Runaway" - Kanye West

떠나요, 서둘러 날 떠나요
당신이 날 떠날 줄 알았어요
(도망쳐요) 나로부터 멀리
나 같은 사람은 다시 못 만날 거예요

늘 알고 있었죠
저 멀리 화려한 세상이 있다는 걸
과거의 실수로 날 찾아올 수도 있겠죠
건배합시다, 우리 같은 문제아들을 위해

[문화적 맥락]
• "runaway" → 도망가다, 현실에서 벗어나다
• "bright lights" → 명성과 성공의 유혹
• "toast" → 건배 (서구 문화의 축하 방식)`,
                
                hiphop: `[힙합 특화 해석] "Runaway" - Kanye West

도망가, 빨리 튀어 from me
너가 날 버릴 거 이미 알고 있었지
(Runaway) 나한테서 멀리 가
나 같은 놈은 두 번 다시 못 만나

항상 알고 있었어 real talk
저기 fancy한 life가 있다는 걸
내 past가 날 쫓아올 수도 있어
Cheers, 우리 같은 troublemaker들에게

[힙합 용어 해설]
• "runaway" = 현실 도피, 관계에서 벗어나기
• "bright lights" = fame과 fortune의 상징
• "fines" = 과거의 죄값, karma
• "douchebags" = 나쁜 놈들 (자조적 표현)

[라임 구조]
• 영어 원곡의 내부 라임과 플로우가 한국어로는 완벽히 전달되지 않음`
            },
            'default': {
                direct: `[직역] "${song}" - ${artist}

이 곡의 직역 번역이 여기 표시됩니다.
원문의 단어와 문장 구조를 최대한 그대로 유지한 번역입니다.`,
                
                cultural: `[의역 - 문화적 맥락] "${song}" - ${artist}

이 곡의 문화적 맥락을 고려한 의역이 여기 표시됩니다.
서구 문화의 표현을 한국 문화에 맞게 재해석했습니다.`,
                
                hiphop: `[힙합 특화 해석] "${song}" - ${artist}

이 곡의 힙합 특화 해석이 여기 표시됩니다.
힙합 용어와 슬랭을 살린 번역입니다.`
            }
        };
        
        // 곡별 의미 분석
        const songMeanings = {
            'Runaway': {
                direct: `"Runaway"는 Kanye West가 자신의 문제점을 인정하며 사랑하는 사람에게 자신으로부터 도망가라고 말하는 곡입니다.`,
                cultural: `이 곡은 자기 파괴적인 행동을 인지하면서도 바꾸지 못하는 한 남자의 고백입니다. 미국 힙합 문화에서 자주 다뤄지는 성공의 어두운 면과 인간관계의 복잡함을 보여줍니다.`,
                hiphop: `Kanye의 가장 개인적이고 취약한 트랙 중 하나. 2010년 MTV VMA 사건 이후 만들어진 이 곡은 자기 성찰과 후회를 담고 있습니다. "toast for the douchebags"는 자신을 포함한 문제적 인물들에 대한 자조적 건배입니다.`
            },
            'default': {
                direct: `"${song}"의 직역적 의미 분석입니다.`,
                cultural: `"${song}"의 문화적 맥락을 고려한 의미 분석입니다.`,
                hiphop: `"${song}"의 힙합 문화적 관점에서의 의미 분석입니다.`
            }
        };
        
        // Runaway 또는 기본 번역 선택
        const translations = demoTranslations[song] || demoTranslations['default'];
        const meanings = songMeanings[song] || songMeanings['default'];
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                originalLyrics: lyrics || `"${song}" by ${artist}\n\n[가사를 가져오는 중...]`,
                translatedLyrics: translations[type],
                songMeaning: meanings[type]
            })
        };
        
    } catch (error) {
        console.error('Demo translation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Translation failed',
                originalLyrics: 'Error loading lyrics',
                translatedLyrics: '번역 중 오류가 발생했습니다.',
                songMeaning: '의미 분석 중 오류가 발생했습니다.'
            })
        };
    }
};