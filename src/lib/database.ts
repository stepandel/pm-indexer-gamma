import { Pool } from 'pg';
import type { PoolConfig } from 'pg';
import { config } from '../config/config';
import { logger } from './logger';

const createDatabaseClient = () => {
  if (!config.database.url) {
    logger.warn('No database URL provided, database operations will be skipped');
    return null;
  }

  const poolConfig: PoolConfig = {
    connectionString: config.database.url,
    max: 10, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
  };

  const pool = new Pool(poolConfig);

  // Handle connection errors
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
  });

  const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
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
      await pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database connection pool', error);
    }
  };

  return {
    query,
    testConnection,
    getSchema,
    close,
    pool
  };
};

export const database = createDatabaseClient();

export type DatabaseClient = NonNullable<ReturnType<typeof createDatabaseClient>>;