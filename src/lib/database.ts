import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';
import { logger } from './logger';

const createDatabaseClient = () => {
  if (!config.database.url) {
    logger.warn('No database URL provided, database operations will be skipped');
    return null;
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

  // Handle Prisma logging
  prisma.$on('query', (e) => {
    logger.debug('Executed query', {
      query: e.query,
      params: e.params,
      duration: e.duration,
      target: e.target
    });
  });

  prisma.$on('error', (e) => {
    logger.error('Prisma error', e);
  });

  prisma.$on('info', (e) => {
    logger.info('Prisma info', e);
  });

  prisma.$on('warn', (e) => {
    logger.warn('Prisma warning', e);
  });

  const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const res = await prisma.$queryRawUnsafe(text, ...(params || []));
      const duration = Date.now() - start;
      logger.debug('Executed raw query', { text, duration, resultCount: Array.isArray(res) ? res.length : 1 });

      // Convert to pg-like result format for compatibility
      return {
        rows: Array.isArray(res) ? res : [res],
        rowCount: Array.isArray(res) ? res.length : (res ? 1 : 0)
      };
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Query failed', { text, duration, error });
      throw error;
    }
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      logger.info('Testing database connection');
      const result = await query('SELECT NOW() as current_time');
      logger.info('Database connection successful', {
        timestamp: result.rows[0].current_time
      });
      return true;
    } catch (error) {
      logger.error('Database connection failed', error);
      return false;
    }
  };

  const getSchema = async (schemaName: string = 'public') => {
    try {
      logger.info(`Fetching schema information for: ${schemaName}`);

      // Get all tables in the schema
      const tablesQuery = `
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name;
      `;

      const tablesResult = await query(tablesQuery, [schemaName]);
      const tables = tablesResult.rows;

      if (tables.length === 0) {
        logger.info(`No tables found in schema: ${schemaName}`);
        return { schema: schemaName, tables: [] };
      }

      logger.info(`Found ${tables.length} tables in schema: ${schemaName}`);

      // Get columns for each table
      const schemaInfo = [];

      for (const table of tables) {
        const columnsQuery = `
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;

        const columnsResult = await query(columnsQuery, [schemaName, table.table_name]);

        schemaInfo.push({
          tableName: table.table_name,
          tableType: table.table_type,
          columns: columnsResult.rows
        });
      }

      return { schema: schemaName, tables: schemaInfo };
    } catch (error) {
      logger.error('Failed to fetch schema information', error);
      throw error;
    }
  };

  const close = async () => {
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', error);
    }
  };

  return {
    query,
    testConnection,
    getSchema,
    close,
    prisma
  };
};

export const database = createDatabaseClient();

export type DatabaseClient = NonNullable<ReturnType<typeof createDatabaseClient>>;