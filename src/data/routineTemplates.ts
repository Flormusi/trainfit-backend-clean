// Rutinas prediseñadas organizadas por objetivo, género y nivel
// Cada rutina contiene 3 días de entrenamiento semanales estructurados en:
// 1. Movilidad/Activación
// 2. Rutina principal (fuerza/técnica/circuito)
// 3. Core/Aislamiento/Cardio

export interface TemplateExercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest?: string;
  notes?: string;
}

export interface TemplateDay {
  day: number;
  name: string;
  sections: {
    movilidad: TemplateExercise[];
    principal: TemplateExercise[];
    core_cardio: TemplateExercise[];
  };
}

export interface RoutineTemplateData {
  id: string;
  name: string;
  description: string;
  trainingObjective: string;
  level: string;
  daysPerWeek: number;
  gender: string;
  duration: string;
  days: TemplateDay[];
  notes: string;
}

export const routineTemplates: RoutineTemplateData[] = [
  // FUERZA - HOMBRE - PRINCIPIANTE
  {
    id: "fuerza-hombre-principiante",
    name: "Fuerza Básica Masculina",
    description: "Rutina de fuerza para hombres principiantes enfocada en movimientos básicos",
    trainingObjective: "Fuerza",
    level: "Principiante",
    daysPerWeek: 3,
    gender: "masculino",
    duration: "60-75 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Tren Superior",
        sections: {
          movilidad: [
            { name: "Movilidad de hombros", sets: 2, reps: "10", rest: "30s" },
            { name: "Rotaciones de brazos", sets: 2, reps: "10 cada dirección", rest: "30s" },
            { name: "Estiramiento de pecho", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Press de banca con barra", sets: 3, reps: "8-10", weight: "60-70% 1RM", rest: "2-3min" },
            { name: "Remo con barra", sets: 3, reps: "8-10", weight: "Moderado", rest: "2-3min" },
            { name: "Press militar con mancuernas", sets: 3, reps: "10-12", weight: "Moderado", rest: "2min" },
            { name: "Dominadas asistidas", sets: 3, reps: "5-8", rest: "2min" }
          ],
          core_cardio: [
            { name: "Curl de bíceps con mancuernas", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Extensiones de tríceps", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Plancha", sets: 3, reps: "30-45s", rest: "1min" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Tren Inferior",
        sections: {
          movilidad: [
            { name: "Movilidad de cadera", sets: 2, reps: "10", rest: "30s" },
            { name: "Estiramiento de cuádriceps", sets: 2, reps: "30s cada pierna", rest: "30s" },
            { name: "Activación de glúteos", sets: 2, reps: "15", rest: "30s" }
          ],
          principal: [
            { name: "Sentadilla con barra", sets: 3, reps: "8-10", weight: "60-70% 1RM", rest: "3min" },
            { name: "Peso muerto rumano", sets: 3, reps: "8-10", weight: "Moderado", rest: "3min" },
            { name: "Prensa de piernas", sets: 3, reps: "12-15", weight: "Moderado", rest: "2min" },
            { name: "Zancadas con mancuernas", sets: 3, reps: "10 cada pierna", rest: "2min" }
          ],
          core_cardio: [
            { name: "Elevaciones de pantorrillas", sets: 3, reps: "15-20", rest: "1min" },
            { name: "Curl femoral", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Bicicleta abdominal", sets: 3, reps: "20", rest: "1min" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - Cuerpo Completo",
        sections: {
          movilidad: [
            { name: "Movilidad general", sets: 2, reps: "10", rest: "30s" },
            { name: "Rotaciones de tronco", sets: 2, reps: "10 cada lado", rest: "30s" },
            { name: "Estiramiento dinámico", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Peso muerto convencional", sets: 3, reps: "6-8", weight: "70-80% 1RM", rest: "3min" },
            { name: "Press inclinado con mancuernas", sets: 3, reps: "8-10", weight: "Moderado", rest: "2min" },
            { name: "Remo en polea", sets: 3, reps: "10-12", weight: "Moderado", rest: "2min" },
            { name: "Sentadilla goblet", sets: 3, reps: "12-15", weight: "Moderado", rest: "2min" }
          ],
          core_cardio: [
            { name: "Elevaciones laterales", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Plancha lateral", sets: 3, reps: "20-30s cada lado", rest: "1min" },
            { name: "Caminata en cinta", sets: 1, reps: "10-15min", rest: "N/A" }
          ]
        }
      }
    ],
    notes: "Rutina diseñada para establecer bases sólidas de fuerza. Enfoque en técnica correcta antes que peso."
  },

  // FUERZA - MUJER - PRINCIPIANTE
  {
    id: "fuerza-mujer-principiante",
    name: "Fuerza Básica Femenina",
    description: "Rutina de fuerza para mujeres principiantes con énfasis en tren inferior",
    trainingObjective: "Fuerza",
    level: "Principiante",
    daysPerWeek: 3,
    gender: "femenino",
    duration: "55-70 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Tren Inferior Enfoque",
        sections: {
          movilidad: [
            { name: "Movilidad de cadera", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación de glúteos", sets: 2, reps: "15", rest: "30s" },
            { name: "Estiramiento de isquiotibiales", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Sentadilla sumo", sets: 3, reps: "10-12", weight: "Moderado", rest: "2-3min" },
            { name: "Peso muerto rumano con mancuernas", sets: 3, reps: "10-12", weight: "Moderado", rest: "2-3min" },
            { name: "Hip thrust", sets: 3, reps: "12-15", weight: "Moderado", rest: "2min" },
            { name: "Zancadas inversas", sets: 3, reps: "10 cada pierna", rest: "2min" }
          ],
          core_cardio: [
            { name: "Abducción de cadera", sets: 3, reps: "15-20", rest: "1min" },
            { name: "Elevaciones de pantorrillas", sets: 3, reps: "15-20", rest: "1min" },
            { name: "Plancha", sets: 3, reps: "30-45s", rest: "1min" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Tren Superior",
        sections: {
          movilidad: [
            { name: "Movilidad de hombros", sets: 2, reps: "10", rest: "30s" },
            { name: "Rotaciones de brazos", sets: 2, reps: "10 cada dirección", rest: "30s" },
            { name: "Estiramiento de pecho", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Press de pecho con mancuernas", sets: 3, reps: "10-12", weight: "Moderado", rest: "2min" },
            { name: "Remo con mancuernas", sets: 3, reps: "10-12", weight: "Moderado", rest: "2min" },
            { name: "Press de hombros con mancuernas", sets: 3, reps: "10-12", weight: "Ligero-Moderado", rest: "2min" },
            { name: "Jalones al pecho", sets: 3, reps: "10-12", weight: "Moderado", rest: "2min" }
          ],
          core_cardio: [
            { name: "Curl de bíceps", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Extensiones de tríceps", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Crunches", sets: 3, reps: "15-20", rest: "1min" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - Cuerpo Completo",
        sections: {
          movilidad: [
            { name: "Movilidad general", sets: 2, reps: "10", rest: "30s" },
            { name: "Rotaciones de cadera", sets: 2, reps: "10 cada dirección", rest: "30s" },
            { name: "Estiramiento dinámico", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Sentadilla goblet", sets: 3, reps: "12-15", weight: "Moderado", rest: "2min" },
            { name: "Press inclinado con mancuernas", sets: 3, reps: "10-12", weight: "Moderado", rest: "2min" },
            { name: "Peso muerto con mancuernas", sets: 3, reps: "10-12", weight: "Moderado", rest: "2min" },
            { name: "Remo en polea baja", sets: 3, reps: "12-15", weight: "Moderado", rest: "2min" }
          ],
          core_cardio: [
            { name: "Elevaciones laterales", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Plancha lateral", sets: 3, reps: "20-30s cada lado", rest: "1min" },
            { name: "Elíptica", sets: 1, reps: "10-15min", rest: "N/A" }
          ]
        }
      }
    ],
    notes: "Rutina adaptada para mujeres con énfasis en glúteos y piernas, manteniendo trabajo de tren superior."
  },

  // HIPERTROFIA - HOMBRE - INTERMEDIO
  {
    id: "hipertrofia-hombre-intermedio",
    name: "Hipertrofia Masculina Intermedia",
    description: "Rutina de hipertrofia para hombres con experiencia previa en entrenamiento",
    trainingObjective: "Hipertrofia",
    level: "Intermedio",
    daysPerWeek: 3,
    gender: "masculino",
    duration: "75-90 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Push (Empuje)",
        sections: {
          movilidad: [
            { name: "Movilidad de hombros", sets: 2, reps: "10", rest: "30s" },
            { name: "Dislocaciones con banda", sets: 2, reps: "15", rest: "30s" },
            { name: "Estiramiento de pecho", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Press de banca", sets: 4, reps: "8-10", weight: "70-80% 1RM", rest: "3min" },
            { name: "Press inclinado con mancuernas", sets: 4, reps: "10-12", weight: "Moderado-Alto", rest: "2-3min" },
            { name: "Press militar", sets: 4, reps: "8-10", weight: "Moderado-Alto", rest: "2-3min" },
            { name: "Fondos en paralelas", sets: 3, reps: "10-15", rest: "2min" }
          ],
          core_cardio: [
            { name: "Elevaciones laterales", sets: 4, reps: "12-15", rest: "1min" },
            { name: "Press francés", sets: 4, reps: "10-12", rest: "1-2min" },
            { name: "Extensiones de tríceps en polea", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Plancha", sets: 3, reps: "45-60s", rest: "1min" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Pull (Tirón)",
        sections: {
          movilidad: [
            { name: "Movilidad de hombros", sets: 2, reps: "10", rest: "30s" },
            { name: "Rotaciones de brazos", sets: 2, reps: "10 cada dirección", rest: "30s" },
            { name: "Activación de dorsales", sets: 2, reps: "15", rest: "30s" }
          ],
          principal: [
            { name: "Peso muerto convencional", sets: 4, reps: "6-8", weight: "75-85% 1RM", rest: "3-4min" },
            { name: "Dominadas", sets: 4, reps: "8-12", rest: "2-3min" },
            { name: "Remo con barra", sets: 4, reps: "8-10", weight: "Moderado-Alto", rest: "2-3min" },
            { name: "Jalones al pecho", sets: 3, reps: "10-12", weight: "Moderado-Alto", rest: "2min" }
          ],
          core_cardio: [
            { name: "Remo con mancuernas", sets: 4, reps: "12-15", rest: "1-2min" },
            { name: "Curl de bíceps con barra", sets: 4, reps: "10-12", rest: "1-2min" },
            { name: "Curl martillo", sets: 3, reps: "12-15", rest: "1min" },
            { name: "Abdominales en polea", sets: 3, reps: "15-20", rest: "1min" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - Legs (Piernas)",
        sections: {
          movilidad: [
            { name: "Movilidad de cadera", sets: 2, reps: "10", rest: "30s" },
            { name: "Estiramiento de cuádriceps", sets: 2, reps: "30s cada pierna", rest: "30s" },
            { name: "Activación de glúteos", sets: 2, reps: "15", rest: "30s" }
          ],
          principal: [
            { name: "Sentadilla con barra", sets: 4, reps: "8-10", weight: "75-85% 1RM", rest: "3-4min" },
            { name: "Peso muerto rumano", sets: 4, reps: "10-12", weight: "Moderado-Alto", rest: "3min" },
            { name: "Prensa de piernas", sets: 4, reps: "12-15", weight: "Alto", rest: "2-3min" },
            { name: "Zancadas con mancuernas", sets: 3, reps: "12 cada pierna", rest: "2min" }
          ],
          core_cardio: [
            { name: "Extensiones de cuádriceps", sets: 4, reps: "12-15", rest: "1-2min" },
            { name: "Curl femoral", sets: 4, reps: "12-15", rest: "1-2min" },
            { name: "Elevaciones de pantorrillas", sets: 4, reps: "15-20", rest: "1min" },
            { name: "Plancha lateral", sets: 3, reps: "30-45s cada lado", rest: "1min" }
          ]
        }
      }
    ],
    notes: "Rutina Push/Pull/Legs para maximizar hipertrofia. Volumen moderado-alto con intensidad controlada."
  },

  // RESISTENCIA CARDIO - MUJER - INTERMEDIO
  {
    id: "resistencia-cardio-mujer-intermedio",
    name: "Resistencia Cardiovascular Femenina",
    description: "Rutina enfocada en resistencia cardiovascular y tonificación para mujeres",
    trainingObjective: "Resistencia cardio",
    level: "Intermedio",
    daysPerWeek: 3,
    gender: "femenino",
    duration: "60-75 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Circuito Metabólico",
        sections: {
          movilidad: [
            { name: "Movilidad articular general", sets: 2, reps: "10", rest: "30s" },
            { name: "Jumping jacks", sets: 2, reps: "20", rest: "30s" },
            { name: "Estiramiento dinámico", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Burpees", sets: 4, reps: "10-15", rest: "45s" },
            { name: "Mountain climbers", sets: 4, reps: "20", rest: "45s" },
            { name: "Sentadillas con salto", sets: 4, reps: "15-20", rest: "45s" },
            { name: "Push-ups", sets: 4, reps: "10-15", rest: "45s" },
            { name: "High knees", sets: 4, reps: "30s", rest: "45s" }
          ],
          core_cardio: [
            { name: "Plancha con elevación de piernas", sets: 3, reps: "10 cada pierna", rest: "30s" },
            { name: "Russian twists", sets: 3, reps: "20", rest: "30s" },
            { name: "Bicicleta estática", sets: 1, reps: "15-20min", rest: "N/A" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Fuerza Resistencia",
        sections: {
          movilidad: [
            { name: "Movilidad de hombros", sets: 2, reps: "10", rest: "30s" },
            { name: "Rotaciones de cadera", sets: 2, reps: "10 cada dirección", rest: "30s" },
            { name: "Activación muscular", sets: 2, reps: "15", rest: "30s" }
          ],
          principal: [
            { name: "Sentadillas", sets: 3, reps: "15-20", weight: "Ligero", rest: "60s" },
            { name: "Press de pecho con mancuernas", sets: 3, reps: "15-20", weight: "Ligero", rest: "60s" },
            { name: "Remo con mancuernas", sets: 3, reps: "15-20", weight: "Ligero", rest: "60s" },
            { name: "Zancadas alternas", sets: 3, reps: "20 total", weight: "Ligero", rest: "60s" },
            { name: "Press de hombros", sets: 3, reps: "15-20", weight: "Ligero", rest: "60s" }
          ],
          core_cardio: [
            { name: "Curl de bíceps", sets: 3, reps: "15-20", rest: "45s" },
            { name: "Extensiones de tríceps", sets: 3, reps: "15-20", rest: "45s" },
            { name: "Crunches", sets: 3, reps: "20-25", rest: "45s" },
            { name: "Elíptica", sets: 1, reps: "10-15min", rest: "N/A" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - HIIT y Core",
        sections: {
          movilidad: [
            { name: "Calentamiento dinámico", sets: 2, reps: "10", rest: "30s" },
            { name: "Activación del core", sets: 2, reps: "15", rest: "30s" },
            { name: "Movilidad de columna", sets: 2, reps: "10", rest: "30s" }
          ],
          principal: [
            { name: "Sprint en cinta", sets: 6, reps: "30s", rest: "90s" },
            { name: "Kettlebell swings", sets: 4, reps: "20", rest: "60s" },
            { name: "Box jumps", sets: 4, reps: "10-15", rest: "60s" },
            { name: "Battle ropes", sets: 4, reps: "30s", rest: "60s" }
          ],
          core_cardio: [
            { name: "Plancha", sets: 4, reps: "45-60s", rest: "45s" },
            { name: "Dead bug", sets: 3, reps: "10 cada lado", rest: "45s" },
            { name: "Bicycle crunches", sets: 3, reps: "20", rest: "45s" },
            { name: "Leg raises", sets: 3, reps: "15", rest: "45s" },
            { name: "Caminata inclinada", sets: 1, reps: "10-15min", rest: "N/A" }
          ]
        }
      }
    ],
    notes: "Rutina diseñada para mejorar capacidad cardiovascular y resistencia muscular con componente de tonificación."
  },

  // POTENCIA - HOMBRE - AVANZADO
  {
    id: "potencia-hombre-avanzado",
    name: "Potencia Masculina Avanzada",
    description: "Rutina de potencia para atletas avanzados con movimientos explosivos",
    trainingObjective: "Potencia",
    level: "Avanzado",
    daysPerWeek: 3,
    gender: "masculino",
    duration: "90-105 minutos",
    days: [
      {
        day: 1,
        name: "Día 1 - Potencia de Tren Inferior",
        sections: {
          movilidad: [
            { name: "Calentamiento dinámico completo", sets: 3, reps: "10", rest: "30s" },
            { name: "Activación neuromuscular", sets: 3, reps: "15", rest: "30s" },
            { name: "Movilidad específica", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Sentadilla con salto", sets: 5, reps: "5", weight: "30-40% 1RM", rest: "3-4min" },
            { name: "Clean and jerk", sets: 5, reps: "3", weight: "70-80% 1RM", rest: "4-5min" },
            { name: "Box jumps", sets: 4, reps: "5", rest: "3min" },
            { name: "Sentadilla frontal", sets: 4, reps: "6-8", weight: "75-85% 1RM", rest: "3-4min" },
            { name: "Sprint en cinta", sets: 6, reps: "15s", rest: "2-3min" }
          ],
          core_cardio: [
            { name: "Saltos laterales", sets: 3, reps: "10 cada lado", rest: "90s" },
            { name: "Elevaciones de pantorrillas explosivas", sets: 4, reps: "12", rest: "90s" },
            { name: "Plancha con palmadas", sets: 3, reps: "10", rest: "90s" }
          ]
        }
      },
      {
        day: 2,
        name: "Día 2 - Potencia de Tren Superior",
        sections: {
          movilidad: [
            { name: "Movilidad de hombros avanzada", sets: 3, reps: "10", rest: "30s" },
            { name: "Activación de cadena posterior", sets: 3, reps: "15", rest: "30s" },
            { name: "Preparación articular", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Press de banca explosivo", sets: 5, reps: "5", weight: "50-60% 1RM", rest: "3-4min" },
            { name: "Snatch", sets: 5, reps: "3", weight: "70-80% 1RM", rest: "4-5min" },
            { name: "Medicine ball slams", sets: 4, reps: "8", rest: "2-3min" },
            { name: "Push-ups con palmada", sets: 4, reps: "8-10", rest: "2-3min" },
            { name: "Remo explosivo", sets: 4, reps: "6", weight: "Moderado-Alto", rest: "3min" }
          ],
          core_cardio: [
            { name: "Battle ropes", sets: 4, reps: "30s", rest: "90s" },
            { name: "Lanzamientos de pelota medicinal", sets: 3, reps: "10", rest: "90s" },
            { name: "Russian twists explosivos", sets: 3, reps: "20", rest: "90s" }
          ]
        }
      },
      {
        day: 3,
        name: "Día 3 - Potencia Integral",
        sections: {
          movilidad: [
            { name: "Calentamiento integral", sets: 3, reps: "10", rest: "30s" },
            { name: "Activación completa", sets: 3, reps: "15", rest: "30s" },
            { name: "Preparación específica", sets: 2, reps: "30s", rest: "30s" }
          ],
          principal: [
            { name: "Thruster", sets: 5, reps: "6", weight: "Moderado-Alto", rest: "3-4min" },
            { name: "Burpees con salto", sets: 4, reps: "8", rest: "3min" },
            { name: "Kettlebell swings", sets: 4, reps: "15", weight: "Alto", rest: "2-3min" },
            { name: "Saltos en profundidad", sets: 4, reps: "5", rest: "3min" },
            { name: "Renegade rows", sets: 3, reps: "10", rest: "2-3min" }
          ],
          core_cardio: [
            { name: "Mountain climbers explosivos", sets: 4, reps: "20", rest: "90s" },
            { name: "Plancha con saltos", sets: 3, reps: "10", rest: "90s" },
            { name: "Sprint intervals", sets: 5, reps: "20s", rest: "2min" }
          ]
        }
      }
    ],
    notes: "Rutina de alta intensidad para desarrollo de potencia. Requiere técnica perfecta y supervisión."
  }
];