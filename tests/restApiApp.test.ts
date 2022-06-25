import request from 'supertest';
import getTestApp from './fixtures/getTestApp';
import testRouter from './fixtures/routes/index';

describe('configureApp', () => {
  it('should work with custom setup', async () => {
    const app = getTestApp({
      setup: (apiRouter) => {
        apiRouter.use('/', testRouter);
        apiRouter.get('/hello-world', (req, res) => {
          res.send('Hello World');
        });
      },
    });

    let res = await request(app).get('/hello-world');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Hello World');

    res = await request(app).get('/hello');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Hello World');

    res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Test App is healthy');
  });
});
