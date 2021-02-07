import { promisify } from 'util';
import redis, { RedisClient } from 'redis';

class Redis {
  private _client: RedisClient | null;

  public get: (key: string) => Promise<string | null>;
  public set: (key: string, value: string) => Promise<unknown>;

  constructor() {
    this._client = redis.createClient({
      url: process.env.REDIS_URL,
    });
    this.get = promisify(this._client.get).bind(this._client);
    this.set = promisify(this._client.set).bind(this._client);
  }

  /**
   * Returns the Redis Client instance.
   * The bot must be started first.
   */
  public get client(): RedisClient {
    if (!this._client) {
      throw new Error('Redis was not started');
    }

    return this._client;
  }
}

export default new Redis();
