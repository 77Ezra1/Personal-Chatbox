const DEFAULT_URL = 'postgres://postgres:postgres@localhost:5432/chatbox';

function getPostgresUrl() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || DEFAULT_URL;
}

module.exports = {
  getPostgresUrl
};


