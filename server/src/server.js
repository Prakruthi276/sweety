const app = require('./app');
const env = require('./config/env');

app.listen(env.PORT, () =>
  console.log(`Sweety API on http://localhost:${env.PORT} (docs: /api-docs)`)
);
