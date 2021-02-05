export interface BaseConfig {
  /**
   * Whether the feature is enabled.
   */
  enabled: boolean;
  /**
   * Name of the feature.
   */
  name: string;
  /**
   * Description of the feature.
   */
  description: string;
}

/**
 * Base class used to implement bot features.
 */
export class Base {
  /**
   * Whether the feature is enabled.
   */
  public readonly enabled: boolean;
  /**
   * Name of the feature.
   */
  public readonly name: string;
  /**
   * Description of the feature.
   */
  public readonly description: string;

  public constructor(config: BaseConfig) {
    this.enabled = config.enabled;
    this.name = config.name;
    this.description = config.description;
  }
}
