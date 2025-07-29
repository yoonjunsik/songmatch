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
        const { artist, title } = event.queryStringParameters || {};
        
        if (!artist || !title) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Artist and title required' })
            };
        }

        console.log('Fetching lyrics for:', artist, '-', title);

        // 여러 가사 소스 시도
        let lyrics = null;
        let source = 'demo';

        // 1. ChartLyrics API 시도 (무료)
        try {
            const chartLyricsUrl = `http://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist=${encodeURIComponent(artist)}&song=${encodeURIComponent(title)}`;
            const chartResponse = await axios.get(chartLyricsUrl, { timeout: 5000 });
            
            if (chartResponse.data && chartResponse.data.includes('<Lyric>')) {
                const lyricMatch = chartResponse.data.match(/<Lyric>([\s\S]*?)<\/Lyric>/);
                if (lyricMatch && lyricMatch[1] && lyricMatch[1].trim()) {
                    lyrics = lyricMatch[1].trim();
                    source = 'ChartLyrics';
                    console.log('Found lyrics from ChartLyrics');
                }
            }
        } catch (err) {
            console.log('ChartLyrics failed:', err.message);
        }

        // 2. 실패 시 데모 가사 제공
        if (!lyrics) {
            lyrics = generateDemoLyrics(title, artist);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                lyrics: lyrics,
                source: source,
                title: title,
                artist: artist
            })
        };
    } catch (error) {
        console.error('Lyrics fetch error:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                lyrics: generateDemoLyrics(
                    event.queryStringParameters?.title || 'Unknown', 
                    event.queryStringParameters?.artist || 'Unknown'
                ),
                source: 'demo',
                error: true
            })
        };
    }
};

// 데모 가사 생성 (저작권 없는 샘플 텍스트)
function generateDemoLyrics(title, artist) {
    const demoLyrics = {
        'Baby': `[Verse 1]
Oh, baby baby
Young love story begins
First time feelings arise
Sweet moments we share

[Chorus]
Baby, baby, oh
Thought you'd always be mine
Baby, baby, oh
Young hearts intertwined

[Verse 2]
School days together
Walking hand in hand
Promise of forever
In this wonderland

[Bridge]
Time goes by so fast
Memories that will last
Growing up together
Young love forever

[Outro]
Baby, baby, oh
This is our story to tell`,

        'default': `[${title} - ${artist}]

[Verse 1]
This is a demo version
Of the song you're looking for
Real lyrics will appear
When the service is restored

[Chorus]
Music brings us together
In harmony we stand
Every note and rhythm
Joining hand in hand

[Verse 2]
Melodies surround us
In this musical space
Finding joy in music
At our own pace

[Bridge]
Songs tell our stories
Express what we feel
Music is the language
That makes it all real

[Outro]
Thank you for using SongMatch
Your music comparison app`
    };

    return demoLyrics[title] || demoLyrics['default'];
}