import { logger } from './logger';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export const request = async <T>(
  baseUrl: string,
  path: string,
  params?: Record<string, any>,
  options: RequestOptions = {}
): Promise<T> => {
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const {
    method = 'GET',
    headers = { 'Content-Type': 'application/json' },
    body,
    timeout = 30000
  } = options;

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('API error', {
        url: url.toString(),
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Request failed', { url: url.toString(), error: error.message });
    }
    throw error;
  }
};

export const fetchBatch = async <T>(
  fetchFn: (params: any) => Promise<T[]>,
  params: Record<string, any> = {},
  limit: number,
  offset: number
): Promise<T[]> => {
  return await fetchFn({
    ...params,
    limit,
    offset,
  });
};

export async function* batchGenerator<T>(
  fetchFn: (params: any) => Promise<T[]>,
  params: Record<string, any> = {},
  limit: number = 500
): AsyncGenerator<T[], void, unknown> {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const batch = await fetchBatch(fetchFn, params, limit, offset);

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      logger.debug(`Fetched batch: ${batch.length} items at offset ${offset}`);
      yield batch;

      offset += batch.length;
    } catch (error) {
      logger.error(`Failed to fetch batch at offset ${offset}`, error);
      throw error;
    }
  }
}