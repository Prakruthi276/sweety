const body = (props, required) => ({
  required: true,
  content: { 'application/json': { schema: { type: 'object', required, properties: props } } },
});
const str = { type: 'string' };

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
  },
};
