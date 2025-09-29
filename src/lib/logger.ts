import { config } from '../config/config';

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

const parseLogLevel = (level: string): LogLevelType => {
  const levelMap: Record<string, LogLevelType> = {
    'debug': LogLevel.DEBUG,
    'info': LogLevel.INFO,
    'warn': LogLevel.WARN,
    'error': LogLevel.ERROR,
  };

  return levelMap[level.toLowerCase()] || LogLevel.INFO;
};

const getLevelName = (level: LogLevelType): string => {
  const names = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
  };
  return names[level];
};

const createLogger = (configLevel: string) => {
  const currentLevel = parseLogLevel(configLevel);

  const log = (level: LogLevelType, message: string, data?: any) => {
    if (level >= currentLevel) {
      const timestamp = new Date().toISOString();
      const levelName = getLevelName(level);
      const logMessage = `[${timestamp}] [${levelName}] ${message}`;

      if (data) {
        console.log(logMessage, JSON.stringify(data, null, 2));
      } else {
        console.log(logMessage);
      }
    }
  };

  return {
    debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, data),
    info: (message: string, data?: any) => log(LogLevel.INFO, message, data),
    warn: (message: string, data?: any) => log(LogLevel.WARN, message, data),
    error: (message: string, data?: any) => log(LogLevel.ERROR, message, data),
  };
};

export const logger = createLogger(config.logging.level);