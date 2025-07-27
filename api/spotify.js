// Spotify API 헬퍼 함수들
export class SpotifyAPI {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
        
        return this.accessToken;
    }

    async searchTracks(query, limit = 5) {
        const token = await this.getAccessToken();
        
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Spotify API 검색 실패');
        }

        const data = await response.json();
        return data.tracks.items;
    }

    async getTrack(trackId) {
        const token = await this.getAccessToken();
        
        const response = await fetch(
            `https://api.spotify.com/v1/tracks/${trackId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Spotify API 트랙 정보 가져오기 실패');
        }

        return await response.json();
    }

    async getArtist(artistId) {
        const token = await this.getAccessToken();
        
        const response = await fetch(
            `https://api.spotify.com/v1/artists/${artistId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Spotify API 아티스트 정보 가져오기 실패');
        }

        return await response.json();
    }

    async getTrackFeatures(trackId) {
        const token = await this.getAccessToken();
        
        const response = await fetch(
            `https://api.spotify.com/v1/audio-features/${trackId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Spotify API 트랙 특성 가져오기 실패');
        }

        return await response.json();
    }
}