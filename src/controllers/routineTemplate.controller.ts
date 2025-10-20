import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RequestWithUser } from '../types/express';
import { selectExercisesForDay, ExerciseSelectionParams } from '../services/exerciseSelectionService';
import { logger } from '../utils/logger';
import { routineTemplates } from '../data/routineTemplates';
import { extendedRoutineTemplates } from '../data/routineTemplatesExtended';

const prisma = new PrismaClient();

// Combinar todas las rutinas prediseñadas
const allPresetTemplates = [...routineTemplates, ...extendedRoutineTemplates];

// Obtener todas las plantillas con filtros opcionales
export const getRoutineTemplates = async (req: Request, res: Response) => {
  try {
    const { 
      trainingObjective, 
      level, 
      daysPerWeek, 
      gender,
      includePresets = 'true' // Por defecto incluir rutinas prediseñadas
    } = req.query;

    let templates: any[] = [];

    // Si se solicitan rutinas prediseñadas, incluirlas
    if (includePresets === 'true') {
      let filteredPresets = [...allPresetTemplates];

      // Aplicar filtros a las rutinas prediseñadas
      if (trainingObjective) {
        filteredPresets = filteredPresets.filter(template => 
          template.trainingObjective.toLowerCase() === (trainingObjective as string).toLowerCase()
        );
      }

      if (level) {
        filteredPresets = filteredPresets.filter(template => 
          template.level.toLowerCase() === (level as string).toLowerCase()
        );
      }

      if (daysPerWeek) {
        filteredPresets = filteredPresets.filter(template => 
          template.daysPerWeek === parseInt(daysPerWeek as string)
        );
      }

      if (gender && gender !== 'unisex') {
        filteredPresets = filteredPresets.filter(template => 
          template.gender === gender || template.gender === 'unisex'
        );
      }

      // Convertir rutinas prediseñadas al formato esperado
      const presetTemplates = filteredPresets.map(template => ({
        ...template,
        exercises: template.days, // Mapear days a exercises para compatibilidad
        creator: {
          id: 'system',
          name: 'Sistema TrainFit',
          email: 'system@trainfit.com'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        createdBy: 'system'
      }));

      templates = [...presetTemplates];
    }

    // Obtener plantillas personalizadas de la base de datos
    const filters: any = {
      isActive: true
    };

    if (trainingObjective) {
      filters.trainingObjective = trainingObjective as string;
    }

    if (level) {
      filters.level = level as string;
    }

    if (daysPerWeek) {
      filters.daysPerWeek = parseInt(daysPerWeek as string);
    }

    if (gender && gender !== 'unisex') {
      filters.OR = [
        { gender: gender as string },
        { gender: 'unisex' },
        { gender: null }
      ];
    }

    const customTemplates = await prisma.routineTemplate.findMany({
      where: filters,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Combinar plantillas prediseñadas y personalizadas
    templates = [...templates, ...customTemplates];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching routine templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las plantillas de rutinas'
    });
  }
};

// Obtener una plantilla específica por ID
export const getRoutineTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.routineTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching routine template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la plantilla'
    });
  }
};

// Crear una nueva plantilla
export const createRoutineTemplate = async (req: RequestWithUser, res: Response) => {
  try {
    const {
      name,
      description,
      trainingObjective,
      level,
      daysPerWeek,
      gender,
      duration,
      exercises,
      notes
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const template = await prisma.routineTemplate.create({
      data: {
        name,
        description,
        trainingObjective,
        level,
        daysPerWeek: parseInt(daysPerWeek),
        gender,
        duration,
        exercises,
        notes,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Plantilla creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating routine template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la plantilla'
    });
  }
};

// Actualizar una plantilla existente
export const updateRoutineTemplate = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      trainingObjective,
      level,
      daysPerWeek,
      gender,
      duration,
      exercises,
      notes,
      isActive
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que la plantilla existe y pertenece al usuario
    const existingTemplate = await prisma.routineTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    if (existingTemplate.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar esta plantilla'
      });
    }

    const updatedTemplate = await prisma.routineTemplate.update({
      where: { id },
      data: {
        name,
        description,
        trainingObjective,
        level,
        daysPerWeek: daysPerWeek ? parseInt(daysPerWeek) : undefined,
        gender,
        duration,
        exercises,
        notes,
        isActive
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Plantilla actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating routine template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la plantilla'
    });
  }
};

// Eliminar una plantilla (soft delete)
export const deleteRoutineTemplate = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que la plantilla existe y pertenece al usuario
    const existingTemplate = await prisma.routineTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    if (existingTemplate.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta plantilla'
      });
    }

    // Soft delete - marcar como inactiva
    await prisma.routineTemplate.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    res.json({
      success: true,
      message: 'Plantilla eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting routine template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la plantilla'
    });
  }
};

// Duplicar una plantilla existente
export const duplicateRoutineTemplate = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const originalTemplate = await prisma.routineTemplate.findUnique({
      where: { id }
    });

    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    const duplicatedTemplate = await prisma.routineTemplate.create({
      data: {
        name: name || `${originalTemplate.name} (Copia)`,
        description: originalTemplate.description,
        trainingObjective: originalTemplate.trainingObjective,
        level: originalTemplate.level,
        daysPerWeek: originalTemplate.daysPerWeek,
        gender: originalTemplate.gender,
        duration: originalTemplate.duration,
        exercises: originalTemplate.exercises,
        notes: originalTemplate.notes,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: duplicatedTemplate,
      message: 'Plantilla duplicada exitosamente'
    });
  } catch (error) {
    console.error('Error duplicating routine template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al duplicar la plantilla'
    });
  }
};

/**
 * Generar plantilla de rutina por objetivo
 * POST /api/routines/templates
 */
export const generateRoutineTemplate = async (req: RequestWithUser, res: Response) => {
  try {
    const { objetivo, dias, nivel, genero } = req.body;
    
    // Validar parámetros requeridos
    if (!objetivo || !dias || !nivel) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros objetivo, dias y nivel son requeridos'
      });
    }
    
    // Validar valores permitidos
    const objetivosValidos = ['fuerza', 'hipertrofia', 'resistencia-cardio', 'potencia', 'quema-grasa'];
    const nivelesValidos = ['principiante', 'intermedio', 'avanzado'];
    const diasValidos = [2, 3];
    const generosValidos = ['masculino', 'femenino', 'unisex'];
    
    if (!objetivosValidos.includes(objetivo)) {
      return res.status(400).json({
        success: false,
        message: `Objetivo debe ser uno de: ${objetivosValidos.join(', ')}`
      });
    }
    
    if (!nivelesValidos.includes(nivel)) {
      return res.status(400).json({
        success: false,
        message: `Nivel debe ser uno de: ${nivelesValidos.join(', ')}`
      });
    }
    
    if (!diasValidos.includes(dias)) {
      return res.status(400).json({
        success: false,
        message: `Días debe ser 2 o 3`
      });
    }
    
    if (genero && !generosValidos.includes(genero)) {
      return res.status(400).json({
        success: false,
        message: `Género debe ser uno de: ${generosValidos.join(', ')}`
      });
    }
    
    logger.info('Generando plantilla de rutina', {
      objetivo,
      dias,
      nivel,
      genero,
      userId: req.user?.id
    });
    
    // Generar ejercicios para cada día
    const template = {
      objetivo,
      dias,
      nivel,
      genero: genero || 'unisex',
      createdAt: new Date().toISOString(),
      days: [] as any[]
    };
    
    for (let day = 1; day <= dias; day++) {
      const params: ExerciseSelectionParams = {
        objetivo,
        splitDay: day,
        nivel: nivel as 'principiante' | 'intermedio' | 'avanzado',
        genero: genero as 'masculino' | 'femenino' | 'unisex',
        dias: dias as 2 | 3
      };
      
      try {
        const exercises = await selectExercisesForDay(params);
        
        // Determinar el nombre del día según el split
        let dayName = `Día ${day}`;
        if (dias === 2) {
          dayName = day === 1 ? 'Upper (Tren Superior)' : 'Lower (Tren Inferior)';
        } else if (dias === 3) {
          const dayNames = ['Push (Empuje)', 'Pull (Tirón)', 'Legs (Piernas)'];
          dayName = dayNames[day - 1];
        }
        
        template.days.push({
          day,
          name: dayName,
          exercises: exercises.map(exercise => ({
            id: exercise.id,
            name: exercise.name,
            description: exercise.description,
            type: exercise.type,
            equipment: exercise.equipment,
            difficulty: exercise.difficulty,
            muscles: exercise.muscles,
            imageUrl: exercise.imageUrl,
            videoUrl: exercise.videoUrl,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            restTime: exercise.restTime,
            notes: exercise.notes,
            order: exercise.order,
            category: exercise.category,
            priority: exercise.priority
          }))
        });
        
        logger.info(`Día ${day} generado con ${exercises.length} ejercicios`);
        
      } catch (dayError) {
        logger.error(`Error generando día ${day}:`, dayError);
        
        // Si falla un día, crear un día con ejercicios por defecto
        template.days.push({
          day,
          name: `Día ${day} (Fallback)`,
          exercises: createFallbackDay(day, objetivo, nivel),
          error: 'Se usaron ejercicios por defecto debido a falta de datos'
        });
      }
    }
    
    // Calcular estadísticas de la plantilla
    const stats = {
      totalExercises: template.days.reduce((sum, day) => sum + day.exercises.length, 0),
      exercisesByCategory: {
        movilidad: 0,
        principal: 0,
        finisher: 0
      },
      muscleGroups: new Set<string>()
    };
    
    template.days.forEach(day => {
      day.exercises.forEach((exercise: any) => {
        if (stats.exercisesByCategory[exercise.category as keyof typeof stats.exercisesByCategory] !== undefined) {
          stats.exercisesByCategory[exercise.category as keyof typeof stats.exercisesByCategory]++;
        }
        exercise.muscles.forEach((muscle: string) => stats.muscleGroups.add(muscle));
      });
    });
    
    const response = {
      success: true,
      message: 'Plantilla generada exitosamente',
      data: {
        template,
        stats: {
          ...stats,
          muscleGroups: Array.from(stats.muscleGroups)
        }
      }
    };
    
    logger.info('Plantilla generada exitosamente', {
      objetivo,
      dias,
      totalExercises: stats.totalExercises,
      userId: req.user?.id
    });
    
    res.status(200).json(response);
    
  } catch (error) {
    logger.error('Error generando plantilla de rutina:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al generar la plantilla',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Obtener rutina prediseñada específica por criterios
export const getPresetRoutine = async (req: Request, res: Response) => {
  try {
    const { objetivo, genero, nivel } = req.query;

    if (!objetivo || !genero || !nivel) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los parámetros: objetivo, genero, nivel'
      });
    }

    // Buscar rutina prediseñada que coincida con los criterios
    const matchingTemplate = allPresetTemplates.find(template => 
      template.trainingObjective.toLowerCase() === (objetivo as string).toLowerCase() &&
      (template.gender === genero || template.gender === 'unisex') &&
      template.level.toLowerCase() === (nivel as string).toLowerCase()
    );

    if (!matchingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una rutina prediseñada que coincida con los criterios especificados'
      });
    }

    // Convertir al formato esperado por el frontend
    const formattedTemplate = {
      ...matchingTemplate,
      exercises: matchingTemplate.days,
      creator: {
        id: 'system',
        name: 'Sistema TrainFit',
        email: 'system@trainfit.com'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      createdBy: 'system'
    };

    res.json({
      success: true,
      data: formattedTemplate
    });
  } catch (error) {
    console.error('Error getting preset routine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la rutina prediseñada'
    });
  }
};
const createFallbackDay = (day: number, objetivo: string, nivel: string) => {
  const fallbackExercises = {
    1: [ // Día 1 - Upper o Push
      {
        id: `fallback_${day}_1`,
        name: 'Flexiones',
        description: 'Ejercicio básico de pecho y tríceps',
        type: 'Funcional',
        equipment: 'Peso corporal',
        difficulty: nivel === 'principiante' ? 'Principiante' : 'Intermedio',
        muscles: ['Pectorales', 'Tríceps'],
        sets: objetivo === 'fuerza' ? 4 : 3,
        reps: objetivo === 'fuerza' ? '3-5' : '8-12',
        weight: 'Peso corporal',
        restTime: objetivo === 'fuerza' ? '3 min' : '90 seg',
        notes: 'Ejercicio de respaldo',
        order: 1,
        category: 'principal',
        priority: 'multiarticular'
      },
      {
        id: `fallback_${day}_2`,
        name: 'Plancha',
        description: 'Ejercicio isométrico de core',
        type: 'Core',
        equipment: 'Peso corporal',
        difficulty: 'Principiante',
        muscles: ['Core'],
        sets: 3,
        reps: '30-60 seg',
        weight: 'Peso corporal',
        restTime: '60 seg',
        notes: 'Mantener posición',
        order: 2,
        category: 'finisher',
        priority: 'core'
      }
    ],
    2: [ // Día 2 - Lower o Pull
      {
        id: `fallback_${day}_1`,
        name: 'Sentadillas',
        description: 'Ejercicio básico de piernas',
        type: 'Funcional',
        equipment: 'Peso corporal',
        difficulty: nivel === 'principiante' ? 'Principiante' : 'Intermedio',
        muscles: ['Cuádriceps', 'Glúteos'],
        sets: objetivo === 'fuerza' ? 4 : 3,
        reps: objetivo === 'fuerza' ? '3-5' : '10-15',
        weight: 'Peso corporal',
        restTime: objetivo === 'fuerza' ? '3 min' : '90 seg',
        notes: 'Ejercicio de respaldo',
        order: 1,
        category: 'principal',
        priority: 'multiarticular'
      },
      {
        id: `fallback_${day}_2`,
        name: 'Abdominales',
        description: 'Ejercicio básico de abdomen',
        type: 'Core',
        equipment: 'Peso corporal',
        difficulty: 'Principiante',
        muscles: ['Abdominales'],
        sets: 3,
        reps: '15-20',
        weight: 'Peso corporal',
        restTime: '45 seg',
        notes: 'Movimiento controlado',
        order: 2,
        category: 'finisher',
        priority: 'core'
      }
    ],
    3: [ // Día 3 - Legs (solo para split de 3 días)
      {
        id: `fallback_${day}_1`,
        name: 'Zancadas',
        description: 'Ejercicio unilateral de piernas',
        type: 'Funcional',
        equipment: 'Peso corporal',
        difficulty: nivel === 'principiante' ? 'Principiante' : 'Intermedio',
        muscles: ['Cuádriceps', 'Glúteos'],
        sets: objetivo === 'fuerza' ? 4 : 3,
        reps: objetivo === 'fuerza' ? '5-8' : '10-12',
        weight: 'Peso corporal',
        restTime: objetivo === 'fuerza' ? '2 min' : '90 seg',
        notes: 'Alternar piernas',
        order: 1,
        category: 'principal',
        priority: 'multiarticular'
      }
    ]
  };
  
  return fallbackExercises[day as keyof typeof fallbackExercises] || fallbackExercises[1];
};