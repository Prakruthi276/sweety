const body = (props, required) => ({
  required: true,
  content: { 'application/json': { schema: { type: 'object', required, properties: props } } },
});
const str = { type: 'string' };

const auth = [{ bearerAuth: [] }];
const idParam = [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }];
const readingBody = body(
  {
    date: { type: 'string', format: 'date', example: '2026-11-09' },
    slot: { type: 'string', enum: ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'] },
    value: { type: 'integer', minimum: 40, maximum: 600, example: 110 },
  },
  ['date', 'slot', 'value']
);
const r = (description) => ({ description });

const readingPaths = {
  '/api/readings': {
    get: {
      tags: ['Readings'], summary: 'List my readings', security: auth,
      parameters: [
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
      ],
      responses: { 200: r('OK'), 400: r('Validation failed'), 401: r('Unauthorized') },
    },
    post: {
      tags: ['Readings'], summary: 'Add a reading', security: auth, requestBody: readingBody,
      responses: { 201: r('Created'), 400: r('Validation failed'), 401: r('Unauthorized'), 409: r('Duplicate slot or day full') },
    },
  },
  '/api/readings/{id}': {
    get: {
      tags: ['Readings'], summary: 'Get one reading', security: auth, parameters: idParam,
      responses: { 200: r('OK'), 401: r('Unauthorized'), 404: r('Not found') },
    },
    put: {
      tags: ['Readings'], summary: 'Edit a reading', security: auth, parameters: idParam, requestBody: readingBody,
      responses: { 200: r('OK'), 400: r('Validation failed'), 401: r('Unauthorized'), 404: r('Not found'), 409: r('Duplicate slot or day full') },
    },
    delete: {
      tags: ['Readings'], summary: 'Delete a reading', security: auth, parameters: idParam,
      responses: { 204: r('Deleted'), 401: r('Unauthorized'), 404: r('Not found') },
    },
  },
};

module.exports = {
  openapi: '3.0.3',
  info: { title: 'Sweety API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:5000' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: body(
          { name: str, email: { type: 'string', format: 'email' }, password: str },
          ['name', 'email', 'password']
        ),
        responses: {
          201: { description: 'Created' },
          400: { description: 'Validation failed' },
          409: { description: 'Email exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in (sets refresh cookie, returns access token)',
        requestBody: body({ email: str, password: str }, ['email', 'password']),
        responses: {
          200: { description: 'OK' },
          400: { description: 'Validation failed' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Get a new access token using the refresh cookie',
        responses: {
          200: { description: 'New access token' },
          401: { description: 'Invalid / expired / reused token' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    ...readingPaths,
  },
};
