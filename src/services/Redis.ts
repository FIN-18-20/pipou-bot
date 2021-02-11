import { promisify } from 'util';
import redis, { RedisClient } from 'redis';

class Redis {
  private _client: RedisClient | null;

  public get: (key: string) => Promise<string | null>;
  public set: (key: string, value: string) => Promise<unknown>;
  public setex: (key: string, seconds: number, value: string) => Promise<unknown>;
  public keys: (pattern: string) => Promise<string[]>;
  public scan: (cursor: string, options: string[]) => Promise<Array<string | string[]>>;
  public del: (key: string) => Promise<number>;

  constructor() {
    this._client = redis.createClient({
      url: process.env.REDIS_URL,
    });
    this.get = promisify(this._client.get).bind(this._client);
    this.set = promisify(this._client.set).bind(this._client);
    this.setex = promisify(this._client.setex).bind(this._client);
    this.keys = promisify(this._client.keys).bind(this._client);
    this.scan = promisify(this._client.scan).bind(this._client);
    this.del = promisify(this._client.del).bind(this._client);
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
