import cluster from 'cluster';
import os from 'os';
import express, {
  Request as ExpressRequest,
  Response,
  NextFunction,
} from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import * as uuid from 'uuid';
import SwaggerExpressValidator from 'swagger-express-validator';
import swaggerUi from 'swagger-ui-express';
import SwaggerUiDist from 'swagger-ui-dist';
import * as ExpressOpenApiValidator from 'express-openapi-validator';
import process from 'process';
import jsyaml from 'js-yaml';
import yamljs from 'yamljs';

export interface AppConfigOptions {
  appName?: string;
  apiOptions?: {
    apiSpec: string;
    specType: 'openapi' | 'swagger';
    validateResponses?: boolean;
  };
  setup: (app: express.Application) => void;
}

export interface ResponseError extends Error {
  // OpenAPI validations specify this; other errors do not.
  status?: number;
}

export interface Request extends ExpressRequest {
  id?: string;
}

function finalErrorHandler(
  err: ResponseError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err) {
    console.error(err.message, err.stack);
    res.status(err.status || 500).send({
      message: err.message || 'Internal server error',
    });
  } else {
    try {
      next();
    } catch (error) {
      console.error((error as Error).message, (error as Error).stack);
    }
  }
}

process.on('exit', (code) => {
  console.log(`Process ${process.pid} is exiting with exit code ${code}`);
});

export function configureApp(options: AppConfigOptions): express.Application {
  const app: express.Application = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(compression());
  app.use(cookieParser());

  const { appName = 'Service', apiOptions, setup } = options;

  // Add service discovery to APIs
  if (apiOptions && apiOptions.apiSpec) {
    const { apiSpec, specType, validateResponses = true } = apiOptions;

    // Provide Swagger UI for consumers to look at API specs
    app.use(express.static(SwaggerUiDist.getAbsoluteFSPath()));
    app.use(
      '/api/docs',
      swaggerUi.serve,
      swaggerUi.setup(yamljs.load(apiSpec))
    );

    // Enforce request-response validations
    if (specType === 'swagger') {
      app.use(
        SwaggerExpressValidator({
          schema: jsyaml.load(fs.readFileSync(apiSpec, 'utf8')) as string,
          validateRequest: true,
          validateResponse: validateResponses,
          allowNullable: true,
        })
      );
    } else {
      app.use(
        ExpressOpenApiValidator.middleware({
          apiSpec: jsyaml.load(fs.readFileSync(apiSpec, 'utf8')) as string,
          validateRequests: true,
          validateResponses: validateResponses,
        })
      );
    }
  }

  // Add traceability to all requests assigning them a unique identifier
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.id) {
      req.id = uuid.v4();
    }
    next();
  });

  // Add health check by default on all web and api applications
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).send(`${appName} is healthy`);
  });

  // Allow consumer to run their route setup
  setup(app);

  // Add final error handler by default as the last middleware to handle unhandled errors from express routes
  app.use(finalErrorHandler);

  return app;
}

export interface AppRunOptions {
  useClusteredStart?: false;
  port?: 4000;
  appName?: 'API';
  setup?: () => Promise<void>;
  callback?: () => void;
}

export function runApp(app: express.Application, options: AppRunOptions): void {
  const { appName, port, useClusteredStart, setup, callback } = options;

  const startApp = () => {
    if (useClusteredStart) {
      if (cluster.isMaster) {
        console.log(`Main server process id: ${process.pid}`);
        const cpus = os.cpus();
        console.log(
          `Forking ${cpus.length} child server processes on CPU Model ${cpus[0].model}`
        );
        for (let i = 0; i < cpus.length; i++) {
          cluster.fork();
        }
      } else {
        app.listen(port, () => {
          console.log(
            `Server child process id ${process.pid} running, listening on port ${port}`
          );
          if (callback && typeof callback === 'function') {
            callback();
          }
        });
      }
    } else {
      app.listen(port, () => {
        console.log(`${appName} started on port ${port}...`);
        if (callback && typeof callback === 'function') {
          callback();
        }
      });
    }
  };

  if (setup && typeof setup === 'function') {
    setup().then(() => {
      startApp();
    });
  } else {
    startApp();
  }
}
