/*
* Database connection pool creation
*/

const { Pool } = require('pg');

const pool = new Pool({
    host: 'autorad-db',
    user: 'postgres',
    database: 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = {
    query: (text, params) => pool.query(text, params)
}
