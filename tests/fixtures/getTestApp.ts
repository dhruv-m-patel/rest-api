import { AppConfigOptions, configureApp } from '../../src';

export default function getTestApp(options?: AppConfigOptions) {
  const noop = () => {
    console.log('Test App running');
  };
  const app = configureApp({
    appName: 'Test App',
    setup: options?.setup || noop,
  });
  return app;
}
