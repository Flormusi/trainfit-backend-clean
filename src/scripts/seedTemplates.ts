import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const baseTemplates = [
  {
    name: 'Hipertrofia 3 días - Intermedio',
    description: 'Rutina de hipertrofia muscular para nivel intermedio con estructura piramidal progresiva',
    trainingObjective: 'Hipertrofia',
    level: 'Intermedio',
    daysPerWeek: 3,
    gender: 'unisex',
    duration: '60 min',
    exercises: {
      day1: {
        name: 'Día 1 - Pecho, Hombros y Tríceps',
        exercises: [
          {
            name: 'Press de banca',
            sets: 5,
            reps: '12-10-8-8-6',
            repType: 'piramidal',
            pyramidalReps: '12-10-8-8-6',
            weight: 'Progresivo',
            restTime: '2-3 min',
            notes: 'Aumentar peso en cada serie'
          },
          {
            name: 'Press inclinado con mancuernas',
            sets: 4,
            reps: '12-10-8-8',
            repType: 'piramidal',
            pyramidalReps: '12-10-8-8',
            weight: 'Progresivo',
            restTime: '2 min'
          },
          {
            name: 'Aperturas con mancuernas',
            sets: 3,
            reps: '12',
            repType: 'normal',
            weight: 'Moderado',
            restTime: '90 seg'
          },
          {
            name: 'Press militar',
            sets: 4,
            reps: '12-10-8-8',
            repType: 'piramidal',
            pyramidalReps: '12-10-8-8',
            weight: 'Progresivo',
            restTime: '2 min'
          },
          {
            name: 'Elevaciones laterales',
            sets: 3,
            reps: '15',
            repType: 'normal',
            weight: 'Ligero-Moderado',
            restTime: '60 seg'
          },
          {
            name: 'Fondos en paralelas',
            sets: 3,
            reps: '12-10-8',
            repType: 'piramidal',
            pyramidalReps: '12-10-8',
            weight: 'Corporal',
            restTime: '90 seg'
          },
          {
            name: 'Extensiones de tríceps',
            sets: 3,
            reps: '12',
            repType: 'normal',
            weight: 'Moderado',
            restTime: '60 seg'
          }
        ]
      },
      day2: {
        name: 'Día 2 - Espalda y Bíceps',
        exercises: [
          {
            name: 'Dominadas',
            sets: 4,
            reps: '12-10-8-8',
            repType: 'piramidal',
            pyramidalReps: '12-10-8-8',
            weight: 'Corporal/Asistido',
            restTime: '2-3 min'
          },
          {
            name: 'Remo con barra',
            sets: 4,
            reps: '12-10-8-8',
            repType: 'piramidal',
            pyramidalReps: '12-10-8-8',
            weight: 'Progresivo',
            restTime: '2 min'
          },
          {
            name: 'Remo con mancuerna',
            sets: 3,
            reps: '12',
            repType: 'normal',
            weight: 'Moderado',
            restTime: '90 seg'
          },
          {
            name: 'Jalones al pecho',
            sets: 3,
            reps: '12',
            repType: 'normal',
            weight: 'Moderado',
            restTime: '90 seg'
          },
          {
            name: 'Curl con barra',
            sets: 4,
            reps: '12-10-8-8',
            repType: 'piramidal',
            pyramidalReps: '12-10-8-8',
            weight: 'Progresivo',
            restTime: '90 seg'
          },
          {
            name: 'Curl martillo',
            sets: 3,
            reps: '12',
            repType: 'normal',
            weight: 'Moderado',
            restTime: '60 seg'
          }
        ]
      },
      day3: {
        name: 'Día 3 - Piernas',
        exercises: [
          {
            name: 'Sentadillas',
            sets: 5,
            reps: '12-10-8-8-6',
            repType: 'piramidal',
            pyramidalReps: '12-10-8-8-6',
            weight: 'Progresivo',
            restTime: '3 min',
            notes: 'Ejercicio principal, aumentar peso progresivamente'
          },
          {
            name: 'Peso muerto rumano',
            sets: 4,
            reps: '12-10-8-8',
            repType: 'piramidal',
            pyramidalReps: '12-10-8-8',
            weight: 'Progresivo',
            restTime: '2-3 min'
          },
          {
            name: 'Prensa de piernas',
            sets: 3,
            reps: '15',
            repType: 'normal',
            weight: 'Moderado-Alto',
            restTime: '2 min'
          },
          {
            name: 'Extensiones de cuádriceps',
            sets: 3,
            reps: '15',
            repType: 'normal',
            weight: 'Moderado',
            restTime: '90 seg'
          },
          {
            name: 'Curl femoral',
            sets: 3,
            reps: '12',
            repType: 'normal',
            weight: 'Moderado',
            restTime: '90 seg'
          },
          {
            name: 'Elevaciones de pantorrillas',
            sets: 4,
            reps: '20',
            repType: 'normal',
            weight: 'Moderado-Alto',
            restTime: '60 seg'
          }
        ]
      }
    },
    notes: 'Rutina diseñada para maximizar la hipertrofia muscular. Descansar 48-72 horas entre sesiones. Aumentar peso progresivamente manteniendo buena técnica.'
  },
  {
    name: 'Fuerza 3 días - Principiante',
    description: 'Rutina de fuerza básica para principiantes con metodología 5x5 y pirámides ascendentes',
    trainingObjective: 'Fuerza',
    level: 'Principiante',
    daysPerWeek: 3,
    gender: 'unisex',
    duration: '45 min',
    exercises: {
      day1: {
        name: 'Día 1 - Sentadilla, Press Banca, Remo',
        exercises: [
          {
            name: 'Sentadillas',
            sets: 5,
            reps: '5',
            repType: 'normal',
            weight: '5x5 - Mismo peso',
            restTime: '3-5 min',
            notes: 'Ejercicio principal - 5 series de 5 repeticiones con el mismo peso'
          },
          {
            name: 'Press de banca',
            sets: 5,
            reps: '5',
            repType: 'normal',
            weight: '5x5 - Mismo peso',
            restTime: '3-5 min',
            notes: 'Ejercicio principal - 5 series de 5 repeticiones con el mismo peso'
          },
          {
            name: 'Remo con barra',
            sets: 5,
            reps: '5',
            repType: 'normal',
            weight: '5x5 - Mismo peso',
            restTime: '3 min',
            notes: 'Ejercicio principal - 5 series de 5 repeticiones con el mismo peso'
          },
          {
            name: 'Plancha',
            sets: 3,
            reps: '30-60 seg',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '60 seg',
            notes: 'Mantener posición el tiempo indicado'
          }
        ]
      },
      day2: {
        name: 'Día 2 - Peso Muerto, Press Militar, Dominadas',
        exercises: [
          {
            name: 'Peso muerto',
            sets: 1,
            reps: '5',
            repType: 'normal',
            weight: 'Máximo técnico',
            restTime: '5 min',
            notes: 'Una sola serie pesada de 5 repeticiones'
          },
          {
            name: 'Press militar',
            sets: 5,
            reps: '5',
            repType: 'normal',
            weight: '5x5 - Mismo peso',
            restTime: '3 min',
            notes: 'Ejercicio principal - 5 series de 5 repeticiones'
          },
          {
            name: 'Dominadas asistidas',
            sets: 3,
            reps: '5-8',
            repType: 'normal',
            weight: 'Asistido/Corporal',
            restTime: '2-3 min',
            notes: 'Usar asistencia si es necesario'
          },
          {
            name: 'Dips asistidos',
            sets: 3,
            reps: '5-8',
            repType: 'normal',
            weight: 'Asistido/Corporal',
            restTime: '2 min',
            notes: 'Usar asistencia si es necesario'
          }
        ]
      },
      day3: {
        name: 'Día 3 - Sentadilla, Press Inclinado, Remo',
        exercises: [
          {
            name: 'Sentadillas',
            sets: 5,
            reps: '5',
            repType: 'normal',
            weight: '5x5 - Mismo peso',
            restTime: '3-5 min',
            notes: 'Ejercicio principal - 5 series de 5 repeticiones'
          },
          {
            name: 'Press inclinado',
            sets: 5,
            reps: '5',
            repType: 'normal',
            weight: '5x5 - Mismo peso',
            restTime: '3 min',
            notes: 'Ejercicio principal - 5 series de 5 repeticiones'
          },
          {
            name: 'Remo con mancuernas',
            sets: 3,
            reps: '8',
            repType: 'normal',
            weight: 'Moderado',
            restTime: '2 min',
            notes: 'Ejercicio accesorio'
          },
          {
            name: 'Peso muerto rumano',
            sets: 3,
            reps: '8',
            repType: 'normal',
            weight: 'Ligero-Moderado',
            restTime: '2 min',
            notes: 'Enfoque en técnica'
          }
        ]
      }
    },
    notes: 'Rutina básica de fuerza 5x5. Aumentar peso cada semana si se completan todas las repeticiones. Descansar al menos 48 horas entre sesiones.'
  },
  {
    name: 'Resistencia 2 días - General',
    description: 'Rutina de resistencia muscular con repeticiones altas y fijas para acondicionamiento general',
    trainingObjective: 'Resistencia',
    level: 'General',
    daysPerWeek: 2,
    gender: 'unisex',
    duration: '50 min',
    exercises: {
      day1: {
        name: 'Día 1 - Tren Superior',
        exercises: [
          {
            name: 'Flexiones de pecho',
            sets: 4,
            reps: '20',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '60 seg',
            notes: 'Mantener ritmo constante'
          },
          {
            name: 'Remo invertido',
            sets: 4,
            reps: '15',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '60 seg',
            notes: 'Usar barra baja o TRX'
          },
          {
            name: 'Press de hombros con mancuernas',
            sets: 3,
            reps: '20',
            repType: 'normal',
            weight: 'Ligero',
            restTime: '45 seg',
            notes: 'Peso ligero, muchas repeticiones'
          },
          {
            name: 'Elevaciones laterales',
            sets: 3,
            reps: '25',
            repType: 'normal',
            weight: 'Muy ligero',
            restTime: '30 seg'
          },
          {
            name: 'Curl de bíceps',
            sets: 3,
            reps: '20',
            repType: 'normal',
            weight: 'Ligero',
            restTime: '30 seg'
          },
          {
            name: 'Extensiones de tríceps',
            sets: 3,
            reps: '20',
            repType: 'normal',
            weight: 'Ligero',
            restTime: '30 seg'
          },
          {
            name: 'Plancha',
            sets: 3,
            reps: '60 seg',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '60 seg',
            notes: 'Mantener posición estable'
          }
        ]
      },
      day2: {
        name: 'Día 2 - Tren Inferior y Core',
        exercises: [
          {
            name: 'Sentadillas con peso corporal',
            sets: 4,
            reps: '25',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '60 seg',
            notes: 'Ritmo controlado'
          },
          {
            name: 'Zancadas alternas',
            sets: 4,
            reps: '20 (10 c/pierna)',
            repType: 'normal',
            weight: 'Corporal/Mancuernas ligeras',
            restTime: '60 seg'
          },
          {
            name: 'Peso muerto con mancuernas',
            sets: 3,
            reps: '20',
            repType: 'normal',
            weight: 'Ligero-Moderado',
            restTime: '45 seg',
            notes: 'Enfoque en técnica y resistencia'
          },
          {
            name: 'Sentadilla sumo',
            sets: 3,
            reps: '20',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '45 seg'
          },
          {
            name: 'Elevaciones de pantorrillas',
            sets: 4,
            reps: '30',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '30 seg'
          },
          {
            name: 'Abdominales',
            sets: 4,
            reps: '25',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '30 seg'
          },
          {
            name: 'Mountain climbers',
            sets: 3,
            reps: '30 seg',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '30 seg',
            notes: 'Mantener ritmo alto'
          },
          {
            name: 'Burpees',
            sets: 3,
            reps: '10',
            repType: 'normal',
            weight: 'Corporal',
            restTime: '60 seg',
            notes: 'Ejercicio de acondicionamiento'
          }
        ]
      }
    },
    notes: 'Rutina de resistencia muscular y acondicionamiento. Descansos cortos entre series. Enfoque en volumen y resistencia cardiovascular.'
  }
];

async function seedTemplates() {
  try {
    console.log('🌱 Iniciando seed de plantillas de rutinas...');

    // Buscar un usuario administrador o crear uno temporal
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@trainfit.com' },
          { role: 'ADMIN' }
        ]
      }
    });

    if (!adminUser) {
      console.log('⚠️  No se encontró usuario administrador, creando uno temporal...');
      adminUser = await prisma.user.create({
        data: {
          name: 'Sistema',
          email: 'system@trainfit.com',
          password: 'temp_password',
          role: 'ADMIN'
        }
      });
    }

    console.log(`👤 Usando usuario: ${adminUser.email} (ID: ${adminUser.id})`);

    // Insertar las plantillas
    for (const template of baseTemplates) {
      const existingTemplate = await prisma.routineTemplate.findFirst({
        where: {
          name: template.name,
          createdBy: adminUser.id
        }
      });

      if (existingTemplate) {
        console.log(`⏭️  Plantilla "${template.name}" ya existe, saltando...`);
        continue;
      }

      const createdTemplate = await prisma.routineTemplate.create({
        data: {
          ...template,
          createdBy: adminUser.id
        }
      });

      console.log(`✅ Plantilla "${createdTemplate.name}" creada exitosamente`);
    }

    console.log('🎉 Seed de plantillas completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed si el archivo se ejecuta directamente
if (require.main === module) {
  seedTemplates()
    .then(() => {
      console.log('✨ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedTemplates;