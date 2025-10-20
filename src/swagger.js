/**
 * Configuración de Swagger/OpenAPI para documentar la API de TrainFit
 */

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Opciones de configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrainFit API',
      version: '1.0.0',
      description: 'API para la aplicación TrainFit de gestión de entrenadores y clientes',
      contact: {
        name: 'Soporte TrainFit',
        email: 'soporte@trainfit.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5002/api',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario'
            },
            name: {
              type: 'string',
              description: 'Nombre completo del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Contraseña del usuario (no se devuelve en las respuestas)'
            },
            role: {
              type: 'string',
              enum: ['TRAINER', 'CLIENT', 'ADMIN'],
              description: 'Rol del usuario'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del usuario'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización del usuario'
            }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del cliente'
            },
            name: {
              type: 'string',
              description: 'Nombre completo del cliente'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del cliente'
            },
            phone: {
              type: 'string',
              description: 'Número de teléfono del cliente'
            },
            clientProfile: {
              type: 'object',
              properties: {
                goals: {
                  type: 'string',
                  description: 'Objetivos del cliente'
                },
                weight: {
                  type: 'number',
                  description: 'Peso del cliente en kg'
                },
                initialObjective: {
                  type: 'string',
                  description: 'Objetivo inicial del cliente'
                },
                trainingDaysPerWeek: {
                  type: 'integer',
                  description: 'Días de entrenamiento por semana'
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del cliente'
            }
          }
        },
        Exercise: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único del ejercicio'
            },
            name: {
              type: 'string',
              description: 'Nombre del ejercicio'
            },
            description: {
              type: 'string',
              description: 'Descripción del ejercicio'
            },
            type: {
              type: 'string',
              description: 'Tipo de ejercicio'
            },
            difficulty: {
              type: 'string',
              enum: ['Principiante', 'Intermedio', 'Avanzado'],
              description: 'Nivel de dificultad del ejercicio'
            },
            equipment: {
              type: 'string',
              description: 'Equipamiento necesario para el ejercicio'
            },
            muscles: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Músculos trabajados en el ejercicio'
            },
            trainerId: {
              type: 'string',
              description: 'ID del entrenador que creó el ejercicio'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del ejercicio'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización del ejercicio'
            }
          }
        },
        Routine: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la rutina'
            },
            name: {
              type: 'string',
              description: 'Nombre de la rutina'
            },
            description: {
              type: 'string',
              description: 'Descripción de la rutina'
            },
            exercises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'ID del ejercicio'
                  },
                  name: {
                    type: 'string',
                    description: 'Nombre del ejercicio'
                  },
                  sets: {
                    type: 'integer',
                    description: 'Número de series'
                  },
                  reps: {
                    type: 'integer',
                    description: 'Número de repeticiones'
                  },
                  weight: {
                    type: 'number',
                    description: 'Peso en kg'
                  },
                  notes: {
                    type: 'string',
                    description: 'Notas adicionales'
                  }
                }
              }
            },
            trainerId: {
              type: 'string',
              description: 'ID del entrenador que creó la rutina'
            },
            clientId: {
              type: 'string',
              description: 'ID del cliente asignado a la rutina'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación de la rutina'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización de la rutina'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Descripción del error'
            },
            errors: {
              type: 'object',
              example: null
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operación exitosa'
            },
            data: {
              type: 'object',
              example: {}
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso no proporcionado o inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'No autorizado',
                errors: null
              }
            }
          }
        },
        BadRequest: {
          description: 'Datos de solicitud inválidos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Solicitud incorrecta',
                errors: [
                  {
                    message: 'El email debe tener un formato válido',
                    path: 'email'
                  }
                ]
              }
            }
          }
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Recurso no encontrado',
                errors: null
              }
            }
          }
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Error interno del servidor',
                errors: null
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/routes/*.ts']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

/**
 * Función para configurar Swagger en la aplicación Express
 * @param {Object} app - Instancia de Express
 */
const setupSwagger = (app) => {
  // Ruta para la documentación de la API
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TrainFit API Documentation'
  }));

  // Ruta para obtener el archivo JSON de la especificación
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Documentación de la API disponible en /api-docs');
};

module.exports = setupSwagger;