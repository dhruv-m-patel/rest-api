# @dhruv-m-patel/rest-api

A package to spin up a REST api server with express including swagger docs and health checks by default

![CI Status](https://github.com/dhruv-m-patel/rest-api/workflows/build/badge.svg)

## Setup

```
git clone git@github.com:dhruv-m-patel/rest-api.git
cd rest-api
npm ci
npm build
```

### Using the package

Your `app.ts` file to configure your app would look like this:

```typescript
import path from 'path';
import { Application } from 'express';
import { configureApp } from '@dhruv-m-patel/rest-api';

const app: Application = configureApp({
  appName: 'My Awesome API',
  setup: (restApiApp) => {
    // Your custom app setup code goes here
  },
});

export default app;
```

Your `server.ts` or `index.ts` file to run your web server would look like this:

```typescript
import app from './app';
import { runApp } from '@dhruv-m-patel/rest-api';

const port: number = Number(process.env.PORT) || 3000;

runApp(app, { port });
```

For a test example, please refer to `tests/restApiApp.ts`.
