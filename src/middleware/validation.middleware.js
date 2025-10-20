/**
 * Middleware para validación de datos en la API
 * Este middleware utiliza Joi para validar los datos de entrada
 * y asegurar que cumplen con los requisitos esperados.
 */

const Joi = require('joi');
const { createError } = require('../utils/responseHandler');

/**
 * Crea un middleware de validación para un esquema Joi
 * @param {Object} schema - Esquema Joi para validar
 * @param {string} property - Propiedad de la solicitud a validar ('body', 'query', 'params')
 * @returns {Function} Middleware de validación
 */
exports.validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Recopilar todos los errores, no solo el primero
      stripUnknown: true, // Eliminar propiedades desconocidas
      errors: { wrap: { label: false } } // Formato de errores más limpio
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        message: detail.message,
        path: detail.path.join('.')
      }));

      return next(createError('Error de validación', 400, errorDetails));
    }

    // Reemplazar los datos originales con los datos validados y sanitizados
    req[property] = value;
    return next();
  };
};

/**
 * Esquemas de validación para diferentes entidades
 */
exports.schemas = {
  // Esquema para autenticación
  auth: {
    login: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'El email debe tener un formato válido',
        'any.required': 'El email es obligatorio'
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': 'La contraseña debe tener al menos {#limit} caracteres',
        'any.required': 'La contraseña es obligatoria'
      })
    }),
    register: Joi.object({
      name: Joi.string().min(3).max(50).required().messages({
        'string.min': 'El nombre debe tener al menos {#limit} caracteres',
        'string.max': 'El nombre no puede tener más de {#limit} caracteres',
        'any.required': 'El nombre es obligatorio'
      }),
      email: Joi.string().email().required().messages({
        'string.email': 'El email debe tener un formato válido',
        'any.required': 'El email es obligatorio'
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': 'La contraseña debe tener al menos {#limit} caracteres',
        'any.required': 'La contraseña es obligatoria'
      }),
      role: Joi.string().valid('trainer', 'client').default('client').messages({
        'any.only': 'El rol debe ser trainer o client'
      })
    })
  },
  
  // Esquema para clientes
  client: {
    create: Joi.object({
      name: Joi.string().min(3).max(50).required().messages({
        'string.min': 'El nombre debe tener al menos {#limit} caracteres',
        'string.max': 'El nombre no puede tener más de {#limit} caracteres',
        'any.required': 'El nombre es obligatorio'
      }),
      email: Joi.string().email().required().messages({
        'string.email': 'El email debe tener un formato válido',
        'any.required': 'El email es obligatorio'
      }),
      phone: Joi.string().allow('', null),
      notes: Joi.string().allow('', null),
      startDate: Joi.date().iso().messages({
        'date.base': 'La fecha de inicio debe ser una fecha válida',
        'date.format': 'La fecha de inicio debe tener formato ISO'
      })
    }),
    update: Joi.object({
      name: Joi.string().min(3).max(50).messages({
        'string.min': 'El nombre debe tener al menos {#limit} caracteres',
        'string.max': 'El nombre no puede tener más de {#limit} caracteres'
      }),
      email: Joi.string().email().messages({
        'string.email': 'El email debe tener un formato válido'
      }),
      phone: Joi.string().allow('', null),
      notes: Joi.string().allow('', null),
      startDate: Joi.date().iso().messages({
        'date.base': 'La fecha de inicio debe ser una fecha válida',
        'date.format': 'La fecha de inicio debe tener formato ISO'
      })
    })
  },
  
  // Esquema para rutinas
  routine: {
    create: Joi.object({
      name: Joi.string().min(3).max(100).required().messages({
        'string.min': 'El nombre debe tener al menos {#limit} caracteres',
        'string.max': 'El nombre no puede tener más de {#limit} caracteres',
        'any.required': 'El nombre es obligatorio'
      }),
      description: Joi.string().allow('', null),
      clientId: Joi.string().required().messages({
        'any.required': 'El ID del cliente es obligatorio'
      }),
      exercises: Joi.array().items(
        Joi.object({
          name: Joi.string().required().messages({
            'any.required': 'El nombre del ejercicio es obligatorio'
          }),
          sets: Joi.number().integer().min(1).messages({
            'number.base': 'El número de series debe ser un número',
            'number.min': 'El número de series debe ser al menos {#limit}'
          }),
          reps: Joi.number().integer().min(1).messages({
            'number.base': 'El número de repeticiones debe ser un número',
            'number.min': 'El número de repeticiones debe ser al menos {#limit}'
          }),
          weight: Joi.number().allow(null),
          notes: Joi.string().allow('', null)
        })
      )
    }),
    update: Joi.object({
      name: Joi.string().min(3).max(100).messages({
        'string.min': 'El nombre debe tener al menos {#limit} caracteres',
        'string.max': 'El nombre no puede tener más de {#limit} caracteres'
      }),
      description: Joi.string().allow('', null),
      exercises: Joi.array().items(
        Joi.object({
          name: Joi.string().required().messages({
            'any.required': 'El nombre del ejercicio es obligatorio'
          }),
          sets: Joi.number().integer().min(1).messages({
            'number.base': 'El número de series debe ser un número',
            'number.min': 'El número de series debe ser al menos {#limit}'
          }),
          reps: Joi.number().integer().min(1).messages({
            'number.base': 'El número de repeticiones debe ser un número',
            'number.min': 'El número de repeticiones debe ser al menos {#limit}'
          }),
          weight: Joi.number().allow(null),
          notes: Joi.string().allow('', null)
        })
      )
    })
  },
  
  // Esquema para analíticas
  analytics: {
    query: Joi.object({
      period: Joi.string().valid('day', 'week', 'month', 'year').default('week').messages({
        'any.only': 'El período debe ser day, week, month o year'
      }),
      startDate: Joi.date().iso().messages({
        'date.base': 'La fecha de inicio debe ser una fecha válida',
        'date.format': 'La fecha de inicio debe tener formato ISO'
      }),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).messages({
        'date.base': 'La fecha de fin debe ser una fecha válida',
        'date.format': 'La fecha de fin debe tener formato ISO',
        'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
      })
    })
  }
};