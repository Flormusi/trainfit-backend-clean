// Extensión de rutinas prediseñadas para completar todas las combinaciones
import { RoutineTemplateData } from './routineTemplates';

export const extendedRoutineTemplates: RoutineTemplateData[] = [
  // QUEMA GRASA - MUJER - PRINCIPIANTE
  {
    id: "quema-grasa-mujer-principiante",
    name: "Quema Grasa Femenina Básica",
    description: "Rutina de quema grasa para mujeres principiantes con circuitos metabólicos",
    trainingObjective: "Quema grasa",
    level: "Principiante",
    daysPerWeek: 3,
    gender: "femenino",
    duration: "45-60 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Circuito Metabólico Básico",
        sections: {
          movilidad: [
            { name: "Marcha en el lugar", sets: 2, reps: "30s", rest: "30s" },
            { name: "Rotaciones de brazos", sets: 2, reps: "10 cada dirección", rest: "30s" },
            { name: "Estiramiento dinámico", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Sentadillas", sets: 3, reps: "15-20", rest: "45s" },
            { name: "Push-ups modificadas", sets: 3, reps: "8-12", rest: "45s" },
            { name: "Zancadas alternas", sets: 3, reps: "20 total", rest: "45s" },
            { name: "Mountain climbers", sets: 3, reps: "20", rest: "45s" },
            { name: "Jumping jacks", sets: 3, reps: "30s", rest: "45s" }
          ],
          core_cardio: [
            { name: "Crunches", sets: 3, reps: "15-20", rest: "30s" },
            { name: "Plancha", sets: 3, reps: "20-30s", rest: "30s" },
            { name: "Caminata rápida", sets: 1, reps: "15-20min", rest: "N/A" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Tonificación y Cardio",
        sections: {
          movilidad: [
            { name: "Calentamiento articular", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación muscular", sets: 2, reps: "15", rest: "30s" },
            { name: "Movilidad de cadera", sets: 2, reps: "10", rest: "30s" }
          ],
          principal: [
            { name: "Sentadilla sumo", sets: 3, reps: "15-20", weight: "Peso corporal", rest: "60s" },
            { name: "Press de pecho con mancuernas", sets: 3, reps: "12-15", weight: "Ligero", rest: "60s" },
            { name: "Peso muerto con mancuernas", sets: 3, reps: "12-15", weight: "Ligero", rest: "60s" },
            { name: "Remo con mancuernas", sets: 3, reps: "12-15", weight: "Ligero", rest: "60s" }
          ],
          core_cardio: [
            { name: "Elevaciones laterales", sets: 3, reps: "12-15", rest: "45s" },
            { name: "Curl de bíceps", sets: 3, reps: "12-15", rest: "45s" },
            { name: "Russian twists", sets: 3, reps: "20", rest: "45s" },
            { name: "Bicicleta estática", sets: 1, reps: "15-20min", rest: "N/A" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - HIIT Principiante",
        sections: {
          movilidad: [
            { name: "Calentamiento progresivo", sets: 2, reps: "10", rest: "30s" },
            { name: "Preparación cardiovascular", sets: 2, reps: "30s", rest: "30s" },
            { name: "Activación general", sets: 2, reps: "15", rest: "30s" }
          ],
          principal: [
            { name: "Burpees modificados", sets: 4, reps: "8-10", rest: "60s" },
            { name: "High knees", sets: 4, reps: "20s", rest: "60s" },
            { name: "Squat jumps", sets: 4, reps: "10-12", rest: "60s" },
            { name: "Push-ups", sets: 4, reps: "8-10", rest: "60s" }
          ],
          core_cardio: [
            { name: "Plancha con rodillas", sets: 3, reps: "10 cada pierna", rest: "45s" },
            { name: "Dead bug", sets: 3, reps: "10 cada lado", rest: "45s" },
            { name: "Leg raises", sets: 3, reps: "10-12", rest: "45s" },
            { name: "Elíptica", sets: 1, reps: "10-15min", rest: "N/A" }
          ]
        }
      }
    ],
    notes: "Rutina diseñada para maximizar quema calórica con impacto moderado en articulaciones."
  },

  // ESTÉTICA/SALUD GENERAL - UNISEX - INTERMEDIO
  {
    id: "estetica-salud-unisex-intermedio",
    name: "Estética y Salud General",
    description: "Rutina equilibrada para mejora estética y salud general, adaptable a ambos géneros",
    trainingObjective: "Estética/salud general",
    level: "Intermedio",
    daysPerWeek: 3,
    gender: "unisex",
    duration: "60-75 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Cuerpo Completo Equilibrado",
        sections: {
          movilidad: [
            { name: "Movilidad articular completa", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación muscular general", sets: 2, reps: "15", rest: "30s" },
            { name: "Estiramiento dinámico", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Sentadilla goblet", sets: 3, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Press de pecho con mancuernas", sets: 3, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Remo con mancuernas", sets: 3, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Press de hombros", sets: 3, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Peso muerto rumano", sets: 3, reps: "12-15", weight: "Moderado", rest: "90s" }
          ],
          core_cardio: [
            { name: "Curl de bíceps", sets: 3, reps: "12-15", rest: "60s" },
            { name: "Extensiones de tríceps", sets: 3, reps: "12-15", rest: "60s" },
            { name: "Plancha", sets: 3, reps: "30-45s", rest: "60s" },
            { name: "Caminata inclinada", sets: 1, reps: "15min", rest: "N/A" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Tonificación y Definición",
        sections: {
          movilidad: [
            { name: "Calentamiento específico", sets: 2, reps: "10", rest: "30s" },
            { name: "Preparación muscular", sets: 2, reps: "15", rest: "30s" },
            { name: "Movilidad dirigida", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Zancadas con mancuernas", sets: 3, reps: "12 cada pierna", weight: "Moderado", rest: "90s" },
            { name: "Press inclinado con mancuernas", sets: 3, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Jalones al pecho", sets: 3, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Hip thrust", sets: 3, reps: "15-20", weight: "Moderado", rest: "90s" },
            { name: "Elevaciones laterales", sets: 3, reps: "12-15", weight: "Ligero-Moderado", rest: "90s" }
          ],
          core_cardio: [
            { name: "Curl martillo", sets: 3, reps: "12-15", rest: "60s" },
            { name: "Fondos en banco", sets: 3, reps: "10-12", rest: "60s" },
            { name: "Russian twists", sets: 3, reps: "20", rest: "60s" },
            { name: "Bicicleta estática", sets: 1, reps: "20min", rest: "N/A" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - Funcional y Cardio",
        sections: {
          movilidad: [
            { name: "Movilidad funcional", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación del core", sets: 2, reps: "15", rest: "30s" },
            { name: "Preparación cardiovascular", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Thruster con mancuernas", sets: 3, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Renegade rows", sets: 3, reps: "10", weight: "Moderado", rest: "90s" },
            { name: "Kettlebell swings", sets: 3, reps: "15-20", weight: "Moderado", rest: "90s" },
            { name: "Step-ups", sets: 3, reps: "12 cada pierna", weight: "Ligero", rest: "90s" },
            { name: "Burpees", sets: 3, reps: "8-10", rest: "90s" }
          ],
          core_cardio: [
            { name: "Mountain climbers", sets: 3, reps: "20", rest: "60s" },
            { name: "Plancha lateral", sets: 3, reps: "20-30s cada lado", rest: "60s" },
            { name: "Bicycle crunches", sets: 3, reps: "20", rest: "60s" },
            { name: "Elíptica", sets: 1, reps: "15-20min", rest: "N/A" }
          ]
        }
      }
    ],
    notes: "Rutina versátil que combina fuerza, tonificación y salud cardiovascular para resultados estéticos y funcionales."
  },

  // MOVILIDAD - UNISEX - PRINCIPIANTE
  {
    id: "movilidad-unisex-principiante",
    name: "Movilidad y Flexibilidad Básica",
    description: "Rutina enfocada en movilidad, flexibilidad y corrección postural",
    trainingObjective: "Movilidad",
    level: "Principiante",
    daysPerWeek: 3,
    gender: "unisex",
    duration: "45-60 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Movilidad de Tren Superior",
        sections: {
          movilidad: [
            { name: "Rotaciones de cuello", sets: 2, reps: "10 cada dirección", rest: "30s" },
            { name: "Rotaciones de hombros", sets: 2, reps: "15 cada dirección", rest: "30s" },
            { name: "Círculos de brazos", sets: 2, reps: "10 cada dirección", rest: "30s" }
          ],
          principal: [
            { name: "Estiramiento de pecho en pared", sets: 3, reps: "45s", rest: "30s" },
            { name: "Estiramiento de dorsales", sets: 3, reps: "45s cada brazo", rest: "30s" },
            { name: "Rotaciones de columna torácica", sets: 3, reps: "10 cada lado", rest: "30s" },
            { name: "Estiramiento de tríceps", sets: 3, reps: "30s cada brazo", rest: "30s" },
            { name: "Cat-cow", sets: 3, reps: "15", rest: "30s" }
          ],
          core_cardio: [
            { name: "Ejercicios de respiración", sets: 3, reps: "10 respiraciones", rest: "60s" },
            { name: "Activación del core suave", sets: 3, reps: "10", rest: "45s" },
            { name: "Caminata suave", sets: 1, reps: "10-15min", rest: "N/A" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Movilidad de Tren Inferior",
        sections: {
          movilidad: [
            { name: "Rotaciones de cadera", sets: 2, reps: "10 cada dirección", rest: "30s" },
            { name: "Balanceo de piernas", sets: 2, reps: "10 cada pierna", rest: "30s" },
            { name: "Rotaciones de tobillos", sets: 2, reps: "10 cada pie", rest: "30s" }
          ],
          principal: [
            { name: "Estiramiento de isquiotibiales", sets: 3, reps: "45s cada pierna", rest: "30s" },
            { name: "Estiramiento de cuádriceps", sets: 3, reps: "45s cada pierna", rest: "30s" },
            { name: "Estiramiento de glúteos", sets: 3, reps: "45s cada pierna", rest: "30s" },
            { name: "Estiramiento de pantorrillas", sets: 3, reps: "45s cada pierna", rest: "30s" },
            { name: "Hip flexor stretch", sets: 3, reps: "45s cada pierna", rest: "30s" }
          ],
          core_cardio: [
            { name: "Elevaciones de rodillas suaves", sets: 3, reps: "10 cada pierna", rest: "45s" },
            { name: "Puente de glúteos", sets: 3, reps: "15", rest: "45s" },
            { name: "Bicicleta estática suave", sets: 1, reps: "15min", rest: "N/A" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - Movilidad Integral y Postura",
        sections: {
          movilidad: [
            { name: "Movilidad de columna completa", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación postural", sets: 2, reps: "15", rest: "30s" },
            { name: "Preparación integral", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Yoga flow básico", sets: 3, reps: "5 repeticiones", rest: "60s" },
            { name: "Estiramiento de psoas", sets: 3, reps: "45s cada lado", rest: "30s" },
            { name: "Twist espinal", sets: 3, reps: "30s cada lado", rest: "30s" },
            { name: "Child's pose", sets: 3, reps: "60s", rest: "30s" },
            { name: "Corrección postural", sets: 3, reps: "10", rest: "30s" }
          ],
          core_cardio: [
            { name: "Respiración diafragmática", sets: 3, reps: "10 respiraciones", rest: "60s" },
            { name: "Plancha suave", sets: 3, reps: "15-20s", rest: "45s" },
            { name: "Relajación activa", sets: 3, reps: "30s", rest: "45s" },
            { name: "Caminata meditativa", sets: 1, reps: "10min", rest: "N/A" }
          ]
        }
      }
    ],
    notes: "Rutina diseñada para mejorar movilidad articular, flexibilidad y postura. Ideal para principiantes o recuperación."
  },

  // FUERZA RESISTENCIA - HOMBRE - INTERMEDIO
  {
    id: "fuerza-resistencia-hombre-intermedio",
    name: "Fuerza Resistencia Masculina",
    description: "Rutina que combina fuerza y resistencia muscular para hombres con experiencia",
    trainingObjective: "Fuerza resistencia",
    level: "Intermedio",
    daysPerWeek: 3,
    gender: "masculino",
    duration: "75-90 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Circuito de Fuerza Superior",
        sections: {
          movilidad: [
            { name: "Movilidad de hombros", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación de dorsales", sets: 2, reps: "15", rest: "30s" },
            { name: "Preparación articular", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Press de banca", sets: 4, reps: "15-20", weight: "60-70% 1RM", rest: "90s" },
            { name: "Remo con barra", sets: 4, reps: "15-20", weight: "Moderado", rest: "90s" },
            { name: "Press militar", sets: 4, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Dominadas", sets: 4, reps: "10-15", rest: "90s" },
            { name: "Fondos en paralelas", sets: 3, reps: "15-20", rest: "90s" }
          ],
          core_cardio: [
            { name: "Curl de bíceps", sets: 3, reps: "15-20", rest: "60s" },
            { name: "Extensiones de tríceps", sets: 3, reps: "15-20", rest: "60s" },
            { name: "Plancha", sets: 3, reps: "45-60s", rest: "60s" },
            { name: "Remo en máquina", sets: 1, reps: "15min", rest: "N/A" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Circuito de Fuerza Inferior",
        sections: {
          movilidad: [
            { name: "Movilidad de cadera", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación de glúteos", sets: 2, reps: "15", rest: "30s" },
            { name: "Preparación de rodillas", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Sentadilla con barra", sets: 4, reps: "15-20", weight: "60-70% 1RM", rest: "2min" },
            { name: "Peso muerto rumano", sets: 4, reps: "15-20", weight: "Moderado", rest: "2min" },
            { name: "Prensa de piernas", sets: 4, reps: "20-25", weight: "Moderado-Alto", rest: "90s" },
            { name: "Zancadas con mancuernas", sets: 4, reps: "15 cada pierna", rest: "90s" },
            { name: "Step-ups", sets: 3, reps: "15 cada pierna", rest: "90s" }
          ],
          core_cardio: [
            { name: "Extensiones de cuádriceps", sets: 3, reps: "20", rest: "60s" },
            { name: "Curl femoral", sets: 3, reps: "20", rest: "60s" },
            { name: "Elevaciones de pantorrillas", sets: 3, reps: "25", rest: "60s" },
            { name: "Bicicleta estática", sets: 1, reps: "20min", rest: "N/A" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - Circuito Metabólico",
        sections: {
          movilidad: [
            { name: "Calentamiento dinámico", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación completa", sets: 2, reps: "15", rest: "30s" },
            { name: "Preparación metabólica", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Thruster", sets: 5, reps: "12-15", weight: "Moderado", rest: "90s" },
            { name: "Burpees", sets: 5, reps: "10-12", rest: "90s" },
            { name: "Kettlebell swings", sets: 5, reps: "20", weight: "Moderado-Alto", rest: "90s" },
            { name: "Mountain climbers", sets: 5, reps: "30", rest: "90s" },
            { name: "Box jumps", sets: 4, reps: "12-15", rest: "90s" }
          ],
          core_cardio: [
            { name: "Russian twists", sets: 4, reps: "25", rest: "60s" },
            { name: "Plancha con elevación de piernas", sets: 3, reps: "10 cada pierna", rest: "60s" },
            { name: "Bicycle crunches", sets: 3, reps: "25", rest: "60s" },
            { name: "Elíptica", sets: 1, reps: "15min", rest: "N/A" }
          ]
        }
      }
    ],
    notes: "Rutina que desarrolla fuerza y resistencia muscular simultáneamente. Volumen alto con intensidad moderada."
  }
];