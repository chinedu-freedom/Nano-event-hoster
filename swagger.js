const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // Specify the OpenAPI version
    info: {
      title: 'Nano-Event API Documentation', // Your API title
      version: '1.0.0', // Your API version
      description: 'API documentation for the Nano-Event platform, including authentication, event management, contact forms, and review submissions. **Remember to replace placeholder IDs/URLs with your actual values, especially the Google Client ID.**',
      contact: {
        name: 'Nano-Event Support',
        email: 'support@nanoevent.com', // Replace with your support email
      },
    },
    // Define servers (e.g., development, production)
    servers: [
      {
        url: 'http://localhost:7000/api', // Your local API base URL
        description: 'Development Server',
      },
      // You can add production servers here:
      // {
      //   url: 'https://api.yourproductiondomain.com/api',
      //   description: 'Production Server',
      // },
    ],
    // Define Security Schemes (e.g., JWT Bearer Token, Google OAuth)
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your application\'s JWT Bearer token in the format: `Bearer YOUR_TOKEN`',
        },
        // --- NEW: Google OAuth2.0 Security Scheme ---
        GoogleOAuth: {
          type: 'oauth2',
          description: 'Google Sign-In authentication flow. The frontend obtains an ID token from Google, which is then sent to the backend for verification.',
          // Define the OAuth flows
          flows: {
            implicit: { // Common for client-side web apps getting ID Token directly
              authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
              scopes: {
                'openid': 'Required for ID token',
                'email': 'Access to user\'s email address',
                'profile': 'Access to user\'s profile information (name, picture)',
              },
            },
            // You could also add 'authorizationCode' flow if your backend directly handles Google redirects
            // authorizationCode: {
            //   authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            //   tokenUrl: 'https://oauth2.googleapis.com/token',
            //   scopes: {
            //     'openid': 'Required for ID token',
            //     'email': 'Access to user\'s email address',
            //     'profile': 'Access to user\'s profile information',
            //   },
            // },
          },
          // Custom extension to display the Google Client ID for reference
          // Note: This is an 'x-` extension and is for documentation clarity, not part of standard OAuth2 spec.
          'x-google-client-id': process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_GOES_HERE',
        },
        // --- END NEW Google OAuth2.0 Security Scheme ---
      },
      // Define all reusable schemas here
      schemas: {
        // --- Common Error Response ---
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { // For validation errors
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'field' },
                  msg: { type: 'string', example: 'Event name is required' },
                  path: { type: 'string', example: 'name' },
                  location: { type: 'string', example: 'body' },
                },
              },
            },
          },
          example: {
            success: false,
            message: "Validation failed.",
            errors: [
              {
                type: "field",
                msg: "Event name is required",
                path: "name",
                location: "body"
              }
            ]
          }
        },

        // --- Reusable User Schema ---
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: "60d0fe4f5311361c40212f00" },
            username: { type: 'string', example: "testuser" },
            email: { type: 'string', format: 'email', example: "user@example.com" },
            isEmailVerified: { type: 'boolean', example: true },
            provider: { type: 'string', example: "email/password", enum: ['email/password', 'google', 'facebook', 'apple'] },
            profilePicture: { type: 'string', format: 'url', example: "https://lh3.googleusercontent.com/a/ABCDEFGHIJKLMNO=s96-c" },
            createdAt: { type: 'string', format: 'date-time', example: "2025-06-12T01:00:00.000Z" },
            updatedAt: { type: 'string', format: 'date-time', example: "2025-06-12T01:00:00.000Z" },
          },
          required: ['id', 'username', 'email', 'isEmailVerified', 'provider'],
        },

        // --- Reusable Event Schema ---
        Event: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: "60d0fe4f5311361c40212f01" },
            name: { type: 'string', example: "Community Sports Day" },
            eventDate: { type: 'string', format: 'date', example: "2025-09-15" },
            time: { type: 'string', example: "10:00" },
            startTime: { type: 'string', example: "09:30" },
            endTime: { type: 'string', example: "17:00" },
            location: { type: 'string', example: "City Park Athletics Track" },
            eventPicture: { type: 'string', format: 'url', example: "https://res.cloudinary.com/your_cloud_name/image/upload/v12345/events/image_id.jpg" },
            eventPicturePublicId: { type: 'string', example: "events/image_id" },
            creator: { type: 'string', example: "60c3e7f3b8f2d5001f3e7c80", description: "ID of the user who created the event" },
            createdAt: { type: 'string', format: 'date-time', example: "2025-06-12T02:17:28.881Z" },
            updatedAt: { type: 'string', format: 'date-time', example: "2025-06-12T02:17:28.881Z" },
          },
          required: ['_id', 'name', 'eventDate', 'startTime', 'endTime', 'location', 'eventPicture', 'creator'],
        },

        // --- Reusable Contact Message Schema ---
        ContactMessage: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: "60d0fe4f5311361c40212f02" },
            name: { type: 'string', example: "Jane Doe" },
            email: { type: 'string', format: 'email', example: "jane.doe@example.com" },
            message: { type: 'string', example: "I have a question about your services." },
            createdAt: { type: 'string', format: 'date-time', example: "2025-06-12T03:00:00.000Z" },
            updatedAt: { type: 'string', format: 'date-time', example: "2025-06-12T03:00:00.000Z" },
          },
          required: ['_id', 'name', 'email', 'message'],
        },

        // --- Reusable Review Message Schema ---
        ReviewMessage: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: "60d0fe4f5311361c40212f03" },
            review: { type: 'string', example: "This platform is excellent! Very easy to use." },
            createdAt: { type: 'string', format: 'date-time', example: "2025-06-12T04:00:00.000Z" },
            updatedAt: { type: 'string', format: 'date-time', example: "2025-06-12T04:00:00.000Z" },
          },
          required: ['_id', 'review'],
        },
      },
    },
  },
  apis: [
    './routes/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
