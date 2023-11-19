import { env } from 'node:process';

import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send(env.APP_NAME);
});

export default app;
