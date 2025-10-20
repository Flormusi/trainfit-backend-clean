"use strict";
// Configuración de reglas por objetivo para plantillas de rutinas
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExercisePriority = exports.isMultiarticular = exports.getMuscleQuotasForDay = exports.getObjectiveRules = exports.MUSCLE_GROUP_MAPPING = exports.EXERCISE_PRIORITIES = exports.OBJECTIVE_RULES = void 0;
// Configuración de objetivos
exports.OBJECTIVE_RULES = {
    fuerza: {
        name: 'Fuerza',
        repRange: { min: 3, max: 6 },
        seriesRange: { min: 3, max: 5 },
        splits: {
            twoDays: {
                name: 'Upper/Lower',
                days: ['Tren Superior', 'Tren Inferior'],
                description: 'División entre tren superior e inferior'
            },
            threeDays: {
                name: 'Push/Pull/Legs',
                days: ['Empuje', 'Tirón', 'Piernas'],
                description: 'División por patrones de movimiento'
            }
        },
        muscleQuotas: {
            twoDays: {
                day1: {
                    pectorales: 2,
                    dorsales: 2,
                    hombros: 2,
                    biceps: 1,
                    triceps: 1
                },
                day2: {
                    piernas: 3,
                    gluteos: 2,
                    isquios: 2,
                    core: 1
                }
            },
            threeDays: {
                day1: {
                    pectorales: 3,
                    hombros: 2,
                    triceps: 2,
                    core: 1
                },
                day2: {
                    dorsales: 3,
                    biceps: 2,
                    trapecio: 1,
                    core: 1
                },
                day3: {
                    piernas: 3,
                    gluteos: 2,
                    isquios: 2,
                    gemelos: 1
                }
            }
        },
        priority: ['multiarticular', 'compuesto', 'aislamiento'],
        estimatedWeight: {
            beginner: 0.6,
            intermediate: 0.75,
            advanced: 0.85
        }
    },
    hipertrofia: {
        name: 'Hipertrofia',
        repRange: { min: 8, max: 15 },
        seriesRange: { min: 3, max: 4 },
        splits: {
            twoDays: {
                name: 'Upper/Lower',
                days: ['Tren Superior', 'Tren Inferior'],
                description: 'División entre tren superior e inferior'
            },
            threeDays: {
                name: 'Push/Pull/Legs',
                days: ['Empuje', 'Tirón', 'Piernas'],
                description: 'División por patrones de movimiento'
            }
        },
        muscleQuotas: {
            twoDays: {
                day1: {
                    pectorales: 2,
                    dorsales: 2,
                    hombros: 2,
                    biceps: 2,
                    triceps: 2
                },
                day2: {
                    piernas: 3,
                    gluteos: 2,
                    isquios: 2,
                    gemelos: 1
                }
            },
            threeDays: {
                day1: {
                    pectorales: 3,
                    hombros: 2,
                    triceps: 3,
                    core: 1
                },
                day2: {
                    dorsales: 3,
                    biceps: 3,
                    trapecio: 1,
                    core: 1
                },
                day3: {
                    piernas: 3,
                    gluteos: 2,
                    isquios: 2,
                    gemelos: 1
                }
            }
        },
        priority: ['compuesto', 'multiarticular', 'aislamiento'],
        estimatedWeight: {
            beginner: 0.5,
            intermediate: 0.65,
            advanced: 0.75
        }
    },
    'resistencia-cardio': {
        name: 'Resistencia Cardiovascular',
        repRange: { min: 15, max: 25 },
        seriesRange: { min: 2, max: 4 },
        splits: {
            twoDays: {
                name: 'Circuito/Cardio',
                days: ['Circuito Funcional', 'Cardio + Core'],
                description: 'Entrenamiento en circuito y cardiovascular'
            },
            threeDays: {
                name: 'Funcional/Cardio/Resistencia',
                days: ['Funcional', 'Cardio', 'Resistencia'],
                description: 'Entrenamiento funcional y cardiovascular'
            }
        },
        muscleQuotas: {
            twoDays: {
                day1: {
                    piernas: 2,
                    pectorales: 1,
                    dorsales: 1,
                    core: 3,
                    cardio: 3
                },
                day2: {
                    cardio: 5,
                    core: 3,
                    movilidad: 2
                }
            },
            threeDays: {
                day1: {
                    piernas: 2,
                    pectorales: 1,
                    dorsales: 1,
                    core: 3,
                    funcional: 3
                },
                day2: {
                    cardio: 6,
                    core: 2,
                    movilidad: 2
                },
                day3: {
                    piernas: 2,
                    gluteos: 1,
                    core: 3,
                    resistencia: 4
                }
            }
        },
        priority: ['funcional', 'cardio', 'core'],
        estimatedWeight: {
            beginner: 0.4,
            intermediate: 0.5,
            advanced: 0.6
        }
    },
    potencia: {
        name: 'Potencia',
        repRange: { min: 3, max: 8 },
        seriesRange: { min: 3, max: 5 },
        splits: {
            twoDays: {
                name: 'Explosivo/Técnico',
                days: ['Potencia Explosiva', 'Técnica + Core'],
                description: 'Entrenamiento de potencia y técnica'
            },
            threeDays: {
                name: 'Potencia/Velocidad/Técnica',
                days: ['Potencia', 'Velocidad', 'Técnica'],
                description: 'Desarrollo integral de potencia'
            }
        },
        muscleQuotas: {
            twoDays: {
                day1: {
                    piernas: 3,
                    potencia: 3,
                    pliometria: 2,
                    core: 2
                },
                day2: {
                    tecnica: 3,
                    core: 3,
                    movilidad: 2,
                    estabilidad: 2
                }
            },
            threeDays: {
                day1: {
                    piernas: 3,
                    potencia: 4,
                    pliometria: 2,
                    core: 1
                },
                day2: {
                    velocidad: 4,
                    agilidad: 2,
                    coordinacion: 2,
                    core: 2
                },
                day3: {
                    tecnica: 3,
                    estabilidad: 3,
                    movilidad: 2,
                    core: 2
                }
            }
        },
        priority: ['pliometrico', 'explosivo', 'tecnico'],
        estimatedWeight: {
            beginner: 0.3,
            intermediate: 0.45,
            advanced: 0.6
        }
    },
    'quema-grasa': {
        name: 'Quema de Grasa',
        repRange: { min: 12, max: 20 },
        seriesRange: { min: 3, max: 4 },
        splits: {
            twoDays: {
                name: 'HIIT/Circuito',
                days: ['HIIT + Fuerza', 'Circuito Metabólico'],
                description: 'Entrenamiento de alta intensidad'
            },
            threeDays: {
                name: 'HIIT/Metabólico/Funcional',
                days: ['HIIT', 'Metabólico', 'Funcional'],
                description: 'Entrenamiento para quema de grasa'
            }
        },
        muscleQuotas: {
            twoDays: {
                day1: {
                    piernas: 2,
                    pectorales: 1,
                    dorsales: 1,
                    hiit: 3,
                    core: 3
                },
                day2: {
                    metabolico: 4,
                    cardio: 3,
                    core: 2,
                    funcional: 1
                }
            },
            threeDays: {
                day1: {
                    hiit: 5,
                    piernas: 2,
                    core: 3
                },
                day2: {
                    metabolico: 4,
                    cardio: 3,
                    funcional: 3
                },
                day3: {
                    funcional: 4,
                    core: 3,
                    movilidad: 2,
                    estiramiento: 1
                }
            }
        },
        priority: ['metabolico', 'hiit', 'funcional'],
        estimatedWeight: {
            beginner: 0.4,
            intermediate: 0.55,
            advanced: 0.65
        }
    }
};
// Tipos de ejercicios por prioridad
exports.EXERCISE_PRIORITIES = {
    multiarticular: ['sentadilla', 'peso muerto', 'press banca', 'dominadas', 'press militar'],
    compuesto: ['remo', 'fondos', 'hip thrust', 'zancadas', 'pull ups'],
    aislamiento: ['curl', 'extensiones', 'elevaciones', 'abdominales', 'gemelos'],
    funcional: ['burpees', 'mountain climbers', 'jumping jacks', 'bear crawl'],
    cardio: ['correr', 'bicicleta', 'elíptica', 'remo cardio', 'step'],
    core: ['plancha', 'crunch', 'russian twist', 'dead bug', 'bird dog'],
    pliometrico: ['saltos', 'box jump', 'jump squat', 'clap push up'],
    explosivo: ['clean', 'snatch', 'push press', 'kettlebell swing'],
    tecnico: ['movilidad', 'activación', 'corrección postural'],
    metabolico: ['circuito', 'tabata', 'emom', 'amrap'],
    hiit: ['sprint', 'intervals', 'battle ropes', 'bike intervals']
};
// Mapeo de grupos musculares a categorías de la DB
exports.MUSCLE_GROUP_MAPPING = {
    pectorales: ['pectorales', 'pecho'],
    dorsales: ['dorsales', 'espalda', 'lat'],
    hombros: ['hombros', 'deltoides'],
    biceps: ['biceps'],
    triceps: ['triceps'],
    piernas: ['piernas', 'cuadriceps', 'femoral'],
    gluteos: ['gluteos', 'glúteos'],
    isquios: ['isquios', 'isquiotibiales'],
    gemelos: ['gemelos', 'pantorrillas'],
    core: ['core', 'abdominales', 'abs'],
    trapecio: ['trapecio', 'traps'],
    cardio: ['cardio', 'cardiovascular'],
    funcional: ['funcional', 'functional'],
    movilidad: ['movilidad', 'flexibility'],
    potencia: ['potencia', 'power'],
    pliometria: ['pliometria', 'plyometric'],
    velocidad: ['velocidad', 'speed'],
    agilidad: ['agilidad', 'agility'],
    coordinacion: ['coordinacion', 'coordination'],
    tecnica: ['tecnica', 'technique'],
    estabilidad: ['estabilidad', 'stability'],
    metabolico: ['metabolico', 'metabolic'],
    hiit: ['hiit', 'interval'],
    resistencia: ['resistencia', 'endurance'],
    estiramiento: ['estiramiento', 'stretching']
};
// Función helper para obtener reglas por objetivo
const getObjectiveRules = (objective) => {
    return exports.OBJECTIVE_RULES[objective] || null;
};
exports.getObjectiveRules = getObjectiveRules;
// Función helper para obtener cuotas por día
const getMuscleQuotasForDay = (objective, splitType, dayNumber) => {
    const rules = (0, exports.getObjectiveRules)(objective);
    if (!rules)
        return null;
    const dayKey = `day${dayNumber}`;
    return rules.muscleQuotas[splitType][dayKey] || null;
};
exports.getMuscleQuotasForDay = getMuscleQuotasForDay;
// Función helper para determinar si un ejercicio es multiarticular
const isMultiarticular = (exerciseName) => {
    const name = exerciseName.toLowerCase();
    return exports.EXERCISE_PRIORITIES.multiarticular.some(keyword => name.includes(keyword.toLowerCase()));
};
exports.isMultiarticular = isMultiarticular;
// Función helper para determinar la prioridad de un ejercicio
const getExercisePriority = (exerciseName) => {
    const name = exerciseName.toLowerCase();
    for (const [priority, keywords] of Object.entries(exports.EXERCISE_PRIORITIES)) {
        if (keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
            return priority;
        }
    }
    return 'aislamiento'; // Default
};
exports.getExercisePriority = getExercisePriority;
exports.default = exports.OBJECTIVE_RULES;
