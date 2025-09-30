#!/usr/bin/env bun

import { database } from '../lib/database';
import { logger } from '../lib/logger';
import { writeFile } from 'fs/promises';
import { join } from 'path';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
}

interface TableInfo {
  tableName: string;
  tableType: string;
  columns: ColumnInfo[];
}

const mapPostgreSQLToTypeScript = (column: ColumnInfo): string => {
  const { data_type, is_nullable, numeric_precision } = column;

  let tsType: string;

  switch (data_type) {
    case 'text':
    case 'character varying':
    case 'varchar':
    case 'char':
    case 'character':
      tsType = 'string';
      break;

    case 'integer':
    case 'smallint':
    case 'bigint':
      tsType = 'number';
      break;

    case 'numeric':
    case 'decimal':
      // For high precision numbers, use string to preserve precision
      if (numeric_precision && numeric_precision > 15) {
        tsType = 'string';
      } else {
        tsType = 'number';
      }
      break;

    case 'real':
    case 'double precision':
      tsType = 'number';
      break;

    case 'boolean':
      tsType = 'boolean';
      break;

    case 'timestamp with time zone':
    case 'timestamp without time zone':
    case 'date':
    case 'time':
      tsType = 'Date';
      break;

    case 'uuid':
      tsType = 'string';
      break;

    case 'json':
    case 'jsonb':
      tsType = 'any';
      break;

    case 'USER-DEFINED':
      // Handle custom enums - you might need to define these manually
      if (column.column_name === 'winner') {
        tsType = 'WinnerEnum';
      } else {
        tsType = 'string';
      }
      break;

    default:
      logger.warn(`Unknown data type: ${data_type}, defaulting to 'any'`);
      tsType = 'any';
  }

  // Add null union if nullable
  if (is_nullable === 'YES') {
    tsType += ' | null';
  }

  return tsType;
};

const toPascalCase = (str: string): string => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const generateInterface = (table: TableInfo): string => {
  const interfaceName = `${toPascalCase(table.tableName)}DB`;

  const properties = table.columns.map(column => {
    const tsType = mapPostgreSQLToTypeScript(column);
    return `  ${column.column_name}: ${tsType};`;
  }).join('\n');

  return `// ${table.tableName} table
export interface ${interfaceName} {
${properties}
}`;
};

const generateInsertType = (table: TableInfo): string => {
  const baseName = toPascalCase(table.tableName);
  const interfaceName = `${baseName}DB`;
  const insertTypeName = `${baseName}Insert`;

  // Find auto-generated columns (id with uuid default, timestamps with now() default)
  const autoColumns = table.columns
    .filter(col =>
      (col.column_default && col.column_default.includes('gen_random_uuid()')) ||
      (col.column_default && col.column_default.includes('now()'))
    )
    .map(col => col.column_name);

  if (autoColumns.length === 0) {
    return `export type ${insertTypeName} = ${interfaceName};`;
  }

  const omittedFields = autoColumns.map(col => `'${col}'`).join(' | ');
  const optionalFields = autoColumns.map(col => `  ${col}?: ${mapPostgreSQLToTypeScript(table.columns.find(c => c.column_name === col)!)};`).join('\n');

  return `export type ${insertTypeName} = Omit<${interfaceName}, ${omittedFields}> & {
${optionalFields}
};`;
};

const generateUpdateType = (table: TableInfo): string => {
  const baseName = toPascalCase(table.tableName);
  const interfaceName = `${baseName}DB`;
  const updateTypeName = `${baseName}Update`;

  // Typically omit id and created_at from updates
  const nonUpdatableFields = ['id', 'created_at'];
  const omittedFields = nonUpdatableFields.map(col => `'${col}'`).join(' | ');

  const hasUpdatedAt = table.columns.some(col => col.column_name === 'updated_at');
  const updatedAtField = hasUpdatedAt ? '\n  updated_at?: Date;' : '';

  return `export type ${updateTypeName} = Partial<Omit<${interfaceName}, ${omittedFields}>> & {${updatedAtField}
};`;
};

const generateTypesFile = async () => {
  if (!database) {
    logger.error('Database client not available');
    process.exit(1);
  }

  try {
    logger.info('Generating TypeScript types from database schema...');

    const schemaInfo = await database.getSchema('public');

    if (schemaInfo.tables.length === 0) {
      logger.error('No tables found in public schema');
      process.exit(1);
    }

    const header = `// Auto-generated database types
// Generated at: ${new Date().toISOString()}
// Do not edit manually - run 'bun run scripts/generate-types.ts' to regenerate

// Custom enums (define manually as needed)
export type WinnerEnum = 'UNRESOLVED' | 'OUTCOME1' | 'OUTCOME2' | 'DRAW';

`;

    const interfaces = schemaInfo.tables.map(generateInterface).join('\n\n');

    const insertTypes = schemaInfo.tables.map(generateInsertType).join('\n\n');

    const updateTypes = schemaInfo.tables.map(generateUpdateType).join('\n\n');

    const utilityTypes = `
// Utility types for database operations
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rowsAffected?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}`;

    const fullContent = [
      header,
      interfaces,
      '',
      '// Insert types (omit auto-generated fields)',
      insertTypes,
      '',
      '// Update types (partial updates)',
      updateTypes,
      utilityTypes
    ].join('\n');

    const outputPath = join(process.cwd(), 'src/types/database.ts');
    await writeFile(outputPath, fullContent, 'utf8');

    logger.info(`Types generated successfully: ${outputPath}`);
    logger.info(`Generated ${schemaInfo.tables.length} table interfaces with insert/update types`);

  } catch (error) {
    logger.error('Failed to generate types', error);
    process.exit(1);
  }
};

const main = async () => {
  try {
    await generateTypesFile();
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