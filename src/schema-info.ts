#!/usr/bin/env bun

import { database } from './lib/database';
import { logger } from './lib/logger';

const main = async () => {
  if (!database) {
    logger.error('Database client not available');
    process.exit(1);
  }

  try {
    logger.info('Fetching database schema information...');

    const schemaInfo = await database.getSchema('public');

    console.log('\n=== DATABASE SCHEMA: public ===\n');

    if (schemaInfo.tables.length === 0) {
      console.log('No tables found in public schema');
      return;
    }

    schemaInfo.tables.forEach((table, index) => {
      console.log(`${index + 1}. Table: ${table.tableName} (${table.tableType})`);
      console.log('   Columns:');

      table.columns.forEach((column: any) => {
        const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = column.column_default ? ` DEFAULT ${column.column_default}` : '';
        const length = column.character_maximum_length ? `(${column.character_maximum_length})` : '';
        const precision = column.numeric_precision ? `(${column.numeric_precision}${column.numeric_scale ? `,${column.numeric_scale}` : ''})` : '';

        console.log(`     - ${column.column_name}: ${column.data_type}${length}${precision} ${nullable}${defaultVal}`);
      });

      console.log(''); // Empty line between tables
    });

    console.log(`\nTotal tables: ${schemaInfo.tables.length}`);

  } catch (error) {
    logger.error('Failed to fetch schema information', error);
    process.exit(1);
  } finally {
    if (database) {
      await database.close();
    }
  }
};

main().catch((error) => {
  logger.error('Fatal error', error);
  process.exit(1);
});