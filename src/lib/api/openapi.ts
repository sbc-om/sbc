import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'SBC API',
    version: '1.0.0',
    description: 'API Documentation for SBC - Smart Business Card Platform',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      description: 'API Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
        description: 'Session cookie authentication',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          ok: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          ok: {
            type: 'boolean',
            example: true,
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'user_123',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          phone: {
            type: 'string',
            example: '+9647712345678',
          },
          fullName: {
            type: 'string',
            example: 'John Doe',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'user',
          },
          displayName: {
            type: 'string',
            example: 'John Doe',
          },
          bio: {
            type: 'string',
            nullable: true,
            example: 'A brief bio',
          },
          avatarUrl: {
            type: 'string',
            nullable: true,
            example: '/media/avatars/user_123.jpg',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
        },
      },
      Business: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'business_123',
          },
          slug: {
            type: 'string',
            example: 'pearl-salon-spa',
          },
          ownerId: {
            type: 'string',
            nullable: true,
          },
          name: {
            type: 'object',
            properties: {
              en: { type: 'string', example: 'Pearl Salon & Spa' },
              ar: { type: 'string', example: 'صالون بيرل وسبا' },
            },
            required: ['en', 'ar'],
          },
          description: {
            type: 'object',
            nullable: true,
            properties: {
              en: { type: 'string' },
              ar: { type: 'string' },
            },
          },
          category: {
            type: 'string',
            nullable: true,
            example: 'Beauty & Spa',
          },
          categoryId: {
            type: 'string',
            nullable: true,
            example: 'category_123',
          },
          city: {
            type: 'string',
            nullable: true,
            example: 'Toronto',
          },
          address: {
            type: 'string',
            nullable: true,
          },
          phone: {
            type: 'string',
            nullable: true,
          },
          email: {
            type: 'string',
            format: 'email',
            nullable: true,
          },
          website: {
            type: 'string',
            format: 'uri',
            nullable: true,
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
          },
          latitude: {
            type: 'number',
            format: 'float',
            nullable: true,
          },
          longitude: {
            type: 'number',
            format: 'float',
            nullable: true,
          },
          avatarMode: {
            type: 'string',
            enum: ['icon', 'logo'],
            example: 'logo',
          },
          avatarUrl: {
            type: 'string',
            nullable: true,
          },
          coverUrl: {
            type: 'string',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'category_123',
          },
          name: {
            type: 'string',
            example: 'Beauty & Spa',
          },
          nameAr: {
            type: 'string',
            nullable: true,
          },
          nameFa: {
            type: 'string',
            nullable: true,
          },
          slug: {
            type: 'string',
            example: 'beauty-spa',
          },
          imageUrl: {
            type: 'string',
            nullable: true,
          },
        },
      },
      LoyaltyProfile: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
          },
          businessName: {
            type: 'string',
            example: 'My Business',
          },
          joinCode: {
            type: 'string',
            nullable: true,
            example: 'JOIN123',
          },
          logoUrl: {
            type: 'string',
            nullable: true,
          },
          location: {
            type: 'object',
            nullable: true,
            properties: {
              lat: {
                type: 'number',
                format: 'float',
              },
              lng: {
                type: 'number',
                format: 'float',
              },
              radiusMeters: {
                type: 'integer',
              },
              label: {
                type: 'string',
                nullable: true,
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      LoyaltyCustomer: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          programId: {
            type: 'string',
          },
          displayName: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
            nullable: true,
          },
          phone: {
            type: 'string',
            nullable: true,
          },
          points: {
            type: 'integer',
          },
          totalEarned: {
            type: 'integer',
          },
          totalRedeemed: {
            type: 'integer',
          },
          joinedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      LoyaltyCard: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          customerId: {
            type: 'string',
          },
          programId: {
            type: 'string',
          },
          barcode: {
            type: 'string',
          },
          design: {
            type: 'object',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          businessId: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
            nullable: true,
          },
          price: {
            type: 'number',
            format: 'float',
          },
          currency: {
            type: 'string',
            example: 'CAD',
          },
          imageUrl: {
            type: 'string',
            nullable: true,
          },
          available: {
            type: 'boolean',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user with email or phone and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: {
                    type: 'string',
                    example: 'user@example.com',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'password123',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                    token: {
                      type: 'string',
                      description: 'JWT authentication token',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'User registration',
        description: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'phone', 'email', 'password'],
                properties: {
                  fullName: {
                    type: 'string',
                    example: 'John Doe',
                  },
                  phone: {
                    type: 'string',
                    example: '+9647712345678',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'newuser@example.com',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 8,
                    example: 'password123',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                    token: {
                      type: 'string',
                      description: 'JWT authentication token',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data or email already taken',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'User logout',
        description: 'Clear authentication session',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/users/me/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        description: 'Retrieve the authenticated user profile information',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    profile: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'User not found',
          },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user profile',
        description: 'Update the authenticated user profile',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: {
                    type: 'string',
                    nullable: true,
                    example: 'John Doe',
                  },
                  bio: {
                    type: 'string',
                    nullable: true,
                    example: 'My bio',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    profile: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/users/me/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Upload user avatar',
        description: 'Upload a new avatar image for the authenticated user',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                  },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Avatar uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    avatarUrl: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid file or request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user avatar',
        description: 'Remove the current avatar image',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: 'Avatar deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/businesses': {
      get: {
        tags: ['Businesses'],
        summary: 'List businesses',
        description: 'Get a list of all businesses with optional search',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Search query (searches name, category, city, tags)',
            required: false,
            schema: { type: 'string', example: 'salon' },
          },
          {
            name: 'locale',
            in: 'query',
            description: 'Preferred language for search',
            required: false,
            schema: { type: 'string', enum: ['en', 'ar', 'fa'], example: 'en' },
          },
        ],
        responses: {
          '200': {
            description: 'List of businesses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    businesses: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Business' },
                    },
                    count: { type: 'integer', example: 42 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/businesses/{idOrSlug}': {
      get: {
        tags: ['Businesses'],
        summary: 'Get business by ID or slug',
        description: 'Retrieve a specific business by its ID or URL slug',
        parameters: [
          {
            name: 'idOrSlug',
            in: 'path',
            required: true,
            description: 'Business ID or slug',
            schema: { type: 'string', example: 'pearl-salon-spa' },
          },
        ],
        responses: {
          '200': {
            description: 'Business found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    business: { $ref: '#/components/schemas/Business' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Business not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List all categories',
        description: 'Get all business categories',
        responses: {
          '200': {
            description: 'List of categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    categories: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Category' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/business-request': {
      post: {
        tags: ['Businesses'],
        summary: 'Submit business request',
        description: 'Submit a new business listing request (requires active Directory subscription)',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'categoryId', 'city'],
                properties: {
                  name: { type: 'string', example: 'My Business' },
                  description: { type: 'string', nullable: true },
                  categoryId: { type: 'string', example: 'category_123' },
                  city: { type: 'string', example: 'Toronto' },
                  address: { type: 'string', nullable: true },
                  phone: { type: 'string', nullable: true },
                  email: { type: 'string', format: 'email', nullable: true },
                  website: { type: 'string', format: 'uri', nullable: true },
                  latitude: { type: 'number', format: 'float', nullable: true },
                  longitude: { type: 'number', format: 'float', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Business request submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request or missing subscription',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/businesses/{id}/media': {
      get: {
        tags: ['Businesses'],
        summary: 'Get business media',
        description: 'Retrieve media files for a specific business',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Business ID',
          },
        ],
        responses: {
          '200': {
            description: 'Business media retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    media: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          url: { type: 'string' },
                          type: { type: 'string', enum: ['avatar', 'cover', 'gallery'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Business not found',
          },
        },
      },
      post: {
        tags: ['Businesses'],
        summary: 'Upload business media',
        description: 'Upload media files for a business',
        security: [{ CookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Business ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  type: { type: 'string', enum: ['avatar', 'cover', 'gallery'] },
                },
                required: ['file', 'type'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Media uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    mediaUrl: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/loyalty/profile': {
      get: {
        tags: ['Loyalty'],
        summary: 'Get loyalty profile',
        description: 'Retrieve the loyalty program profile for the authenticated user',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: 'Loyalty profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    profile: {
                      nullable: true,
                      allOf: [{ $ref: '#/components/schemas/LoyaltyProfile' }],
                    } as any,
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
      patch: {
        tags: ['Loyalty'],
        summary: 'Update loyalty profile',
        description: 'Create or update the loyalty program profile',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['businessName'],
                properties: {
                  businessName: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 120,
                    example: 'My Business',
                  },
                  joinCode: {
                    type: 'string',
                    nullable: true,
                    example: 'JOIN123',
                  },
                  logoUrl: {
                    type: 'string',
                    nullable: true,
                  },
                  location: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      lat: { type: 'number', format: 'float' },
                      lng: { type: 'number', format: 'float' },
                      radiusMeters: { type: 'integer', minimum: 25, maximum: 20000 },
                      label: { type: 'string', nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Loyalty profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    profile: { $ref: '#/components/schemas/LoyaltyProfile' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/loyalty/lookup': {
      post: {
        tags: ['Loyalty'],
        summary: 'Lookup loyalty customer',
        description: 'Find a customer by barcode or join code',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  barcode: { type: 'string' },
                  joinCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Customer found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    customer: { $ref: '#/components/schemas/LoyaltyCustomer' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/loyalty/customers/{id}/points': {
      post: {
        tags: ['Loyalty'],
        summary: 'Add loyalty points',
        description: 'Add points to a customer loyalty account',
        security: [{ CookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['points'],
                properties: {
                  points: {
                    type: 'integer',
                    minimum: 1,
                    example: 10,
                  },
                  note: {
                    type: 'string',
                    nullable: true,
                    example: 'Purchase reward',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Points added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    customer: { $ref: '#/components/schemas/LoyaltyCustomer' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Customer not found',
          },
        },
      },
    },
    '/api/loyalty/customers/{id}/redeem': {
      post: {
        tags: ['Loyalty'],
        summary: 'Redeem loyalty points',
        description: 'Redeem points from a customer loyalty account',
        security: [{ CookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['points'],
                properties: {
                  points: {
                    type: 'integer',
                    minimum: 1,
                    example: 50,
                  },
                  note: {
                    type: 'string',
                    nullable: true,
                    example: 'Redeemed for discount',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Points redeemed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    customer: { $ref: '#/components/schemas/LoyaltyCustomer' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request or insufficient points',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Customer not found',
          },
        },
      },
    },
    '/api/loyalty/card-design': {
      get: {
        tags: ['Loyalty'],
        summary: 'Get card design',
        description: 'Get the loyalty card design for the authenticated user program',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: 'Card design retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    design: { type: 'object' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
      post: {
        tags: ['Loyalty'],
        summary: 'Update card design',
        description: 'Update the loyalty card design',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  design: {
                    type: 'object',
                    description: 'Card design configuration',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Card design updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    design: { type: 'object' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid design data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/loyalty/messages': {
      post: {
        tags: ['Loyalty'],
        summary: 'Send push notification',
        description: 'Send a push notification to loyalty program customers',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'body'],
                properties: {
                  title: {
                    type: 'string',
                    example: 'Special Offer',
                  },
                  body: {
                    type: 'string',
                    example: 'Get 20% off your next visit!',
                  },
                  url: {
                    type: 'string',
                    nullable: true,
                    example: '/offers/special',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Notification sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    sent: { type: 'integer', example: 150 },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/loyalty/wallet/apple/{cardId}': {
      get: {
        tags: ['Loyalty', 'Wallet'],
        summary: 'Get Apple Wallet pass',
        description: 'Generate and download Apple Wallet pass for loyalty card',
        parameters: [
          {
            name: 'cardId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Loyalty card ID',
          },
        ],
        responses: {
          '200': {
            description: 'Apple Wallet pass file',
            content: {
              'application/vnd.apple.pkpass': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          '404': {
            description: 'Card not found',
          },
        },
      },
    },
    '/api/loyalty/wallet/google/{cardId}': {
      get: {
        tags: ['Loyalty', 'Wallet'],
        summary: 'Get Google Wallet pass',
        description: 'Generate Google Wallet pass URL for loyalty card',
        parameters: [
          {
            name: 'cardId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Loyalty card ID',
          },
        ],
        responses: {
          '200': {
            description: 'Google Wallet pass URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    url: { type: 'string', example: 'https://pay.google.com/...' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Card not found',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints (login, register, logout)',
    },
    {
      name: 'Users',
      description: 'User authentication and profile management',
    },
    {
      name: 'Businesses',
      description: 'Business directory and management',
    },
    {
      name: 'Categories',
      description: 'Business categories',
    },
    {
      name: 'Loyalty',
      description: 'Loyalty program and card management',
    },
    {
      name: 'Wallet',
      description: 'Digital wallet integration (Apple Wallet, Google Wallet)',
    },
    {
      name: 'Store',
      description: 'E-commerce and product catalog',
    },
  ],
};
