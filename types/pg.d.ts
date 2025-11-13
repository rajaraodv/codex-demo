declare module "pg" {
  export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number;
  }

  export class Pool {
    constructor(config?: any);
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: any;
    [key: string]: any;
  }
}
