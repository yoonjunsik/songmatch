const axios = require('axios');

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
        const { artist } = event.queryStringParameters || {};
        
        if (!artist) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Artist name required' })
            };
        }

        console.log('Fetching Wikipedia data for:', artist);

        // Wikipedia API로 아티스트 페이지 검색
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(artist + ' musician singer')}&srlimit=3`;
        
        const searchResponse = await axios.get(searchUrl);
        const searchResults = searchResponse.data.query.search;
        
        if (!searchResults || searchResults.length === 0) {
            throw new Error('Artist not found on Wikipedia');
        }

        // 첫 번째 검색 결과의 페이지 내용 가져오기
        const pageTitle = searchResults[0].title;
        const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=false&explaintext=true&titles=${encodeURIComponent(pageTitle)}`;
        
        const contentResponse = await axios.get(contentUrl);
        const pages = contentResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const content = pages[pageId].extract || '';

        // 수상 정보 추출
        const awardInfo = extractAwardInfo(content, artist);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                artist: artist,
                wikipediaTitle: pageTitle,
                grammy: awardInfo.grammy,
                other: awardInfo.other,
                source: 'wikipedia'
            })
        };

    } catch (error) {
        console.error('Wikipedia API error:', error);
        
        // 에러 시 기본값 반환
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                artist: event.queryStringParameters?.artist || 'Unknown',
                grammy: '정보 없음',
                other: '정보 없음',
                source: 'fallback'
            })
        };
    }
};

// Wikipedia 텍스트에서 수상 정보 추출
function extractAwardInfo(content, artistName) {
    const info = {
        grammy: '정보 없음',
        other: '정보 없음'
    };

    // 텍스트를 소문자로 변환하여 검색
    const lowerContent = content.toLowerCase();
    
    // Grammy 관련 패턴
    const grammyPatterns = [
        /(\d+)\s*grammy\s*award/gi,
        /grammy\s*award[s]?\s*[:]\s*(\d+)/gi,
        /won\s*(\d+)\s*grammy/gi,
        /(\d+)\s*grammy\s*nomination/gi,
        /nominated\s*for\s*(\d+)\s*grammy/gi,
        /(\d+)\s*[-–]\s*time\s*grammy/gi
    ];

    let grammyWins = 0;
    let grammyNominations = 0;

    // Grammy 수상 정보 찾기
    for (const pattern of grammyPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
            const number = parseInt(match[1]);
            if (!isNaN(number)) {
                if (pattern.toString().includes('nomination') || pattern.toString().includes('nominated')) {
                    grammyNominations = Math.max(grammyNominations, number);
                } else {
                    grammyWins = Math.max(grammyWins, number);
                }
            }
        }
    }

    // Awards 섹션 찾기
    const awardsSection = findSection(content, ['awards', 'accolades', 'achievements', 'honors']);
    
    if (awardsSection) {
        // 더 정확한 Grammy 정보 추출
        const grammyMatch = awardsSection.match(/grammy[^.]*?(\d+)[^.]*?win[^.]*?(\d+)[^.]*?nominat/i);
        if (grammyMatch) {
            grammyWins = parseInt(grammyMatch[1]) || grammyWins;
            grammyNominations = parseInt(grammyMatch[2]) || grammyNominations;
        }
    }

    // Grammy 정보 포맷팅
    if (grammyWins > 0 || grammyNominations > 0) {
        info.grammy = '';
        if (grammyWins > 0) {
            info.grammy += `${grammyWins}회 수상`;
        }
        if (grammyNominations > 0) {
            info.grammy += (grammyWins > 0 ? ', ' : '') + `${grammyNominations}회 노미네이트`;
        }
    }

    // 기타 주요 시상식 정보
    const otherAwards = [];
    
    // 주요 시상식 패턴
    const awardTypes = {
        'MTV': ['mtv video music award', 'mtv vma', 'video music award'],
        'Billboard': ['billboard music award', 'billboard award'],
        'AMA': ['american music award', 'ama award'],
        'BET': ['bet award', 'black entertainment television'],
        'BRIT': ['brit award', 'british award'],
        'Juno': ['juno award'],
        'Mercury': ['mercury prize', 'mercury award']
    };

    for (const [awardName, patterns] of Object.entries(awardTypes)) {
        for (const pattern of patterns) {
            const regex = new RegExp(`(\\d+)\\s*${pattern}`, 'gi');
            const match = content.match(regex);
            if (match) {
                const number = parseInt(match[0].match(/\d+/)[0]);
                if (!isNaN(number) && number > 0) {
                    otherAwards.push(`${awardName} ${number}회`);
                    break;
                }
            }
        }
    }

    // 총 수상 횟수 찾기
    const totalAwardsMatch = content.match(/(?:total|over|more than)\s*(\d+)\s*(?:awards|accolades)/i);
    if (totalAwardsMatch && otherAwards.length === 0) {
        const total = parseInt(totalAwardsMatch[1]);
        if (!isNaN(total) && total > 0) {
            otherAwards.push(`총 ${total}개 이상의 상 수상`);
        }
    }

    if (otherAwards.length > 0) {
        info.other = otherAwards.slice(0, 3).join(', ');
    }

    return info;
}

// 특정 섹션 찾기
function findSection(content, sectionNames) {
    const lines = content.split('\n');
    let inSection = false;
    let sectionContent = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        // 섹션 시작 확인
        if (sectionNames.some(name => line.includes(name) && line.length < 50)) {
            inSection = true;
            continue;
        }
        
        // 다음 섹션 시작 시 종료
        if (inSection && line.match(/^[A-Z]/) && line.length < 50 && i > 0) {
            break;
        }
        
        if (inSection) {
            sectionContent += lines[i] + '\n';
        }
    }
    
    return sectionContent;
}