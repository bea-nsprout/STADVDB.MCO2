import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg'
import type { DB } from '../../utils/db/olap-types';

const dialect = new PostgresDialect({
    pool: new Pool({
        connectionString: process.env.REPORTS_DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        maxLifetimeSeconds: 60
    })
})

const olapdb = new Kysely<DB>({dialect})
export { olapdb };