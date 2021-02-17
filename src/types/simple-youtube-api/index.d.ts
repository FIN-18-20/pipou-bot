declare module 'simple-youtube-api' {
  interface Thumbnail {
    url: string;
    width: number;
    height: number;
  }

  interface Thumbnails {
    default: Thumbnail;
    medium: Thumbnail;
    high: Thumbnail;
    standard?: Thumbnail;
    maxres?: Thumbnail;
  }

  class Channel {
    commentCount?: number;
    country?: string;
    customURL?: string;
    defaultLanguage?: string;
    description?: string;
    full: boolean;
    hiddenSubscriberCount?: boolean;
    id: string;
    kind: string;
    publishedAt?: Date;
    raw: unknown;
    relatedPlaylists: {
      likes: string;
      favorites: string;
      uploades: string;
    };
    subscriberCount?: number;
    thumbnails?: Thumbnails;
    title?: string;
    type: string;
    url: string;
    videoCount?: number;
    viewCount?: number;
    youtube: YouTube;

    fetch: (options?: unknown) => Promise<Channel>;
    static extractID: (url: string) => string;
  }

  class Video {
    channel: Channel;
    description: string;
    duration?: {
      hours?: number;
      minutes?: number;
      seconds?: number;
    };
    durationSeconds: number;
    full: boolean;
    id: string;
    kind: string;
    publishedAt: Date;
    raw: unknown;
    shortURL: string;
    thumbnails: Thumbnails;
    title: string;
    type: string;
    url: string;
    youtube: YouTube;

    fetch: (options?: unknown) => Promise<Video>;
    static extractID: (url: string) => string;
  }

  class Playlist {
    channel: Channel;
    channelTitle?: string;
    defaultLanguage?: string;
    description?: string;
    embedHTML?: string;
    id: string;
    length: number;
    privacy: string;
    publishedAt?: Date;
    thumbnails?: Thumbnails;
    title?: string;
    type: string;
    url: string;
    videos: Array<Video>;
    youtube: YouTube;

    fetch: (options?: unknown) => Promise<Playlist>;
    static extractID: (url: string) => string;
    getVideos: (limit?: number, options?: unknown) => Promise<Array<Video>>;
  }

  export default class YouTube {
    constructor(key: string);

    getVideo: (url: string, options?: unknown) => Promise<Video | null>;
    getVideoByID: (id: string, options?: unknown) => Promise<Video | null>;

    getPlaylist: (url: string, options?: unknown) => Promise<Playlist | null>;
    getPlaylistByID: (
      id: string,
      options?: unknown,
    ) => Promise<Playlist | null>;

    getChannel: (url: string, options?: unknown) => Promise<Channel | null>;
    getChannelByID: (id: string, options?: unknown) => Promise<Channel | null>;

    search: (
      query: string,
      limit?: number,
      options?: unknown,
    ) => Promise<Array<Video | Playlist | Channel | null>>;
    searchVideos: (
      query: string,
      limit?: number,
      options?: unknown,
    ) => Promise<Array<Video>>;
    searchPlaylists: (
      query: string,
      limit?: number,
      options?: unknown,
    ) => Promise<Array<Playlist>>;
    searchChannels: (
      query: string,
      limit?: number,
      options?: unknown,
    ) => Promise<Array<Channel>>;
  }
}
