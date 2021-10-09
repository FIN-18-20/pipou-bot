import YouTube from 'simple-youtube-api';

class YouTubeService {
  private readonly _apiKey?: string;
  private readonly _youtube: YouTube;

  constructor() {
    this._apiKey = process.env.YOUTUBE_API_KEY;

    if (!this._apiKey) {
      throw new Error(
        'You need to give a YouTube API Key inside the .env file.',
      );
    }

    this._youtube = new YouTube(this._apiKey);
  }

  async getPlaylist(id: string) {
    return this._youtube.getPlaylistByID(id);
  }

  async getVideo(query: string) {
    return this._youtube.getVideo(query);
  }

  async searchVideos(query: string, number = 1) {
    return this._youtube.searchVideos(query, number);
  }
}

export default new YouTubeService();
