// YouTube API 헬퍼 함수들
export class YouTubeAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    }

    async searchVideos(query, maxResults = 1) {
        const url = `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${this.apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('YouTube API 검색 실패');
        }

        const data = await response.json();
        return data.items;
    }

    async getVideoStatistics(videoId) {
        const url = `${this.baseUrl}/videos?part=statistics&id=${videoId}&key=${this.apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('YouTube API 비디오 통계 가져오기 실패');
        }

        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            return null;
        }

        return data.items[0].statistics;
    }

    async getMusicVideoViews(songTitle, artistName) {
        try {
            // 공식 뮤직비디오 검색
            const searchQueries = [
                `${artistName} ${songTitle} official music video`,
                `${artistName} ${songTitle} official video`,
                `${artistName} ${songTitle} MV`,
                `${artistName} ${songTitle}`
            ];

            for (const query of searchQueries) {
                const videos = await this.searchVideos(query, 3);
                
                if (videos && videos.length > 0) {
                    // 가장 관련성 높은 비디오 선택
                    for (const video of videos) {
                        const title = video.snippet.title.toLowerCase();
                        const channelTitle = video.snippet.channelTitle.toLowerCase();
                        
                        // 공식 채널이거나 제목에 official이 포함된 경우 우선 선택
                        if (channelTitle.includes(artistName.toLowerCase()) || 
                            title.includes('official') || 
                            channelTitle.includes('vevo')) {
                            
                            const stats = await this.getVideoStatistics(video.id.videoId);
                            if (stats) {
                                return {
                                    viewCount: parseInt(stats.viewCount) || 0,
                                    likeCount: parseInt(stats.likeCount) || 0,
                                    commentCount: parseInt(stats.commentCount) || 0,
                                    videoId: video.id.videoId,
                                    title: video.snippet.title,
                                    channelTitle: video.snippet.channelTitle
                                };
                            }
                        }
                    }
                    
                    // 공식 채널을 찾지 못한 경우 첫 번째 결과 사용
                    const stats = await this.getVideoStatistics(videos[0].id.videoId);
                    if (stats) {
                        return {
                            viewCount: parseInt(stats.viewCount) || 0,
                            likeCount: parseInt(stats.likeCount) || 0,
                            commentCount: parseInt(stats.commentCount) || 0,
                            videoId: videos[0].id.videoId,
                            title: videos[0].snippet.title,
                            channelTitle: videos[0].snippet.channelTitle
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('YouTube 뮤직비디오 조회수 가져오기 오류:', error);
            return null;
        }
    }
}