/**
 * @fileoverview Base logger implementation for DRY logging
 * @module staging-auth-bridge/utils/baseLogger
 * 
 * Provides a base class for all logger implementations to avoid
 * duplicate code for level checking, context enrichment, and
 * standard log methods.
 */

import { Logger, LogContext, LogLevel } from '../types'
import { getConfig } from '../config'

/**
 * Base logger implementation
 * 
 * Provides common functionality for all logger implementations:
 * - Log level filtering
 * - Context enrichment with timestamps
 * - Standard log method implementations
 * 
 * @abstract
 */
export abstract class BaseLogger implements Logger {
  protected readonly baseContext: LogContext = {}
  
  /**
   * Constructor
   * @param componentName - Name of the component using this logger
   */
  constructor(protected readonly componentName: string) {
    this.baseContext = { component: componentName }
  }
  
  /**
   * Abstract method that child classes must implement
   * @abstract
   */
  abstract flush(): Promise<void>
  
  /**
   * Abstract method for the actual logging implementation
   * @abstract
   */
  protected abstract doLog(
    level: LogLevel,
    context: LogContext,
    message: string
  ): void | Promise<void>
  
  /**
   * Check if a message should be logged based on configured level
   */
  protected shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const configLevel = getConfig().logging.level
    const configLevelIndex = levels.indexOf(configLevel)
    const messageLevelIndex = levels.indexOf(level)
    
    return messageLevelIndex >= configLevelIndex
  }
  
  /**
   * Enrich context with common fields
   */
  protected enrichContext(context: LogContext): LogContext {
    return {
      timestamp: new Date().toISOString(),
      ...this.baseContext,
      ...context,
    }
  }
  
  /**
   * Internal log method with level checking
   */
  protected async log(
    level: LogLevel,
    context: LogContext,
    message: string
  ): Promise<void> {
    if (!this.shouldLog(level)) {
      return
    }
    
    const enrichedContext = this.enrichContext(context)
    await this.doLog(level, enrichedContext, message)
  }
  
  // Standard log methods
  async info(context: LogContext, message: string): Promise<void> {
    return this.log('info', context, message)
  }
  
  async error(context: LogContext, message: string): Promise<void> {
    return this.log('error', context, message)
  }
  
  async warn(context: LogContext, message: string): Promise<void> {
    return this.log('warn', context, message)
  }
  
  async debug(context: LogContext, message: string): Promise<void> {
    return this.log('debug', context, message)
  }
}