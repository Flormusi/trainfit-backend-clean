"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseTemplates = createBaseTemplates;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Plantillas base para demostrar la funcionalidad
const baseTemplates = [
    {
        name: "Hipertrofia 3 Días - Principiante",
        description: "Rutina de hipertrofia diseñada para principiantes, enfocada en el crecimiento muscular con ejercicios básicos y efectivos.",
        trainingObjective: "hipertrofia",
        level: "principiante",
        daysPerWeek: 3,
        gender: "unisex",
        duration: "60-75 min",
        exercises: [
            {
                name: "Sentadillas",
                series: "3",
                reps: "12",
                weight: "20",
                notes: "Mantén la espalda recta y baja hasta que los muslos estén paralelos al suelo",
                day: 1,
                repType: "normal"
            },
            {
                name: "Press de Banca",
                series: "3",
                reps: "10",
                weight: "40",
                notes: "Controla el movimiento tanto en la bajada como en la subida",
                day: 1,
                repType: "normal"
            },
            {
                name: "Remo con Barra",
                series: "3",
                reps: "12",
                weight: "30",
                notes: "Mantén el core activado y lleva la barra hacia el abdomen",
                day: 1,
                repType: "normal"
            },
            {
                name: "Press Militar",
                series: "3",
                reps: "10",
                weight: "25",
                notes: "Mantén el core firme y presiona verticalmente",
                day: 2,
                repType: "normal"
            },
            {
                name: "Peso Muerto",
                series: "3",
                reps: "8",
                weight: "50",
                notes: "Mantén la barra cerca del cuerpo durante todo el movimiento",
                day: 2,
                repType: "normal"
            },
            {
                name: "Dominadas Asistidas",
                series: "3",
                reps: "8",
                weight: "",
                notes: "Usa asistencia si es necesario, enfócate en la técnica",
                day: 3,
                repType: "normal"
            }
        ],
        notes: "Descansa 48-72 horas entre sesiones. Aumenta el peso gradualmente cada semana."
    },
    {
        name: "Fuerza 3 Días - Intermedio",
        description: "Rutina de fuerza para nivel intermedio con enfoque en los movimientos básicos y progresión de cargas.",
        trainingObjective: "fuerza",
        level: "intermedio",
        daysPerWeek: 3,
        gender: "unisex",
        duration: "75-90 min",
        exercises: [
            {
                name: "Sentadilla Trasera",
                series: "4",
                pyramidalReps: "8, 6, 4, 2",
                weight: "60-100",
                notes: "Incrementa el peso en cada serie. Descansa 3-4 minutos entre series",
                day: 1,
                repType: "pyramidal"
            },
            {
                name: "Press de Banca",
                series: "4",
                pyramidalReps: "8, 6, 4, 2",
                weight: "50-80",
                notes: "Enfócate en la potencia y técnica perfecta",
                day: 1,
                repType: "pyramidal"
            },
            {
                name: "Peso Muerto Convencional",
                series: "4",
                pyramidalReps: "6, 4, 2, 1",
                weight: "80-120",
                notes: "Movimiento explosivo en la subida, control en la bajada",
                day: 2,
                repType: "pyramidal"
            },
            {
                name: "Press Militar",
                series: "4",
                reps: "6",
                weight: "40",
                notes: "Mantén el core activado durante todo el movimiento",
                day: 2,
                repType: "normal"
            },
            {
                name: "Dominadas Lastradas",
                series: "4",
                reps: "5",
                weight: "10",
                notes: "Agrega peso progresivamente",
                day: 3,
                repType: "normal"
            }
        ],
        notes: "Rutina de fuerza máxima. Calienta adecuadamente antes de cada sesión."
    },
    {
        name: "Resistencia 2 Días - Funcional",
        description: "Rutina de resistencia cardiovascular y muscular con ejercicios funcionales de alta intensidad.",
        trainingObjective: "resistencia_cardio",
        level: "intermedio",
        daysPerWeek: 2,
        gender: "unisex",
        duration: "45-60 min",
        exercises: [
            {
                name: "Burpees",
                series: "4",
                reps: "15",
                weight: "",
                notes: "Mantén un ritmo constante, enfócate en la técnica",
                day: 1,
                repType: "normal"
            },
            {
                name: "Kettlebell Swings",
                series: "4",
                reps: "20",
                weight: "16",
                notes: "Movimiento explosivo de cadera",
                day: 1,
                repType: "normal"
            },
            {
                name: "Mountain Climbers",
                series: "4",
                reps: "30",
                weight: "",
                notes: "Mantén el core activado, ritmo rápido",
                day: 1,
                repType: "normal"
            },
            {
                name: "Thrusters",
                series: "4",
                reps: "12",
                weight: "20",
                notes: "Movimiento fluido de sentadilla a press",
                day: 2,
                repType: "normal"
            },
            {
                name: "Box Jumps",
                series: "4",
                reps: "10",
                weight: "",
                notes: "Aterrizaje suave, extensión completa de cadera",
                day: 2,
                repType: "normal"
            },
            {
                name: "Remo en Máquina",
                series: "3",
                reps: "500m",
                weight: "",
                notes: "Mantén un ritmo constante y fuerte",
                day: 2,
                repType: "normal"
            }
        ],
        notes: "Descansos cortos entre ejercicios (30-60 segundos). Hidratación constante."
    },
    {
        name: "Definición 4 Días - Avanzado",
        description: "Rutina de definición muscular para nivel avanzado con alta frecuencia y volumen de entrenamiento.",
        trainingObjective: "quema_grasa",
        level: "avanzado",
        daysPerWeek: 4,
        gender: "unisex",
        duration: "60-75 min",
        exercises: [
            {
                name: "Sentadillas Frontales",
                series: "4",
                reps: "15",
                weight: "50",
                notes: "Tempo controlado, enfoque en la contracción muscular",
                day: 1,
                repType: "normal"
            },
            {
                name: "Press Inclinado con Mancuernas",
                series: "4",
                pyramidalReps: "15, 12, 10, 8",
                weight: "25-35",
                notes: "Incrementa peso, mantén la tensión muscular",
                day: 1,
                repType: "pyramidal"
            },
            {
                name: "Peso Muerto Rumano",
                series: "4",
                reps: "12",
                weight: "60",
                notes: "Enfócate en el estiramiento de isquiotibiales",
                day: 2,
                repType: "normal"
            },
            {
                name: "Pull-ups",
                series: "4",
                reps: "12",
                weight: "",
                notes: "Contracción completa en la parte superior",
                day: 2,
                repType: "normal"
            },
            {
                name: "Dips",
                series: "3",
                reps: "15",
                weight: "",
                notes: "Rango completo de movimiento",
                day: 3,
                repType: "normal"
            },
            {
                name: "Plancha",
                series: "3",
                reps: "60s",
                weight: "",
                notes: "Mantén la línea corporal recta",
                day: 4,
                repType: "normal"
            }
        ],
        notes: "Rutina de alto volumen. Combinar con cardio moderado y dieta hipocalórica."
    },
    {
        name: "Funcional 3 Días - Femenino",
        description: "Rutina funcional diseñada específicamente para mujeres, enfocada en movimientos naturales y fuerza funcional.",
        trainingObjective: "estetica_salud",
        level: "intermedio",
        daysPerWeek: 3,
        gender: "femenino",
        duration: "50-65 min",
        exercises: [
            {
                name: "Sentadilla Goblet",
                series: "3",
                reps: "15",
                weight: "15",
                notes: "Mantén el pecho alto y el core activado",
                day: 1,
                repType: "normal"
            },
            {
                name: "Push-ups Modificadas",
                series: "3",
                reps: "12",
                weight: "",
                notes: "Desde rodillas si es necesario, progresa a completas",
                day: 1,
                repType: "normal"
            },
            {
                name: "Peso Muerto con Mancuernas",
                series: "3",
                reps: "12",
                weight: "20",
                notes: "Enfócate en la activación de glúteos",
                day: 2,
                repType: "normal"
            },
            {
                name: "Remo Invertido",
                series: "3",
                reps: "10",
                weight: "",
                notes: "Mantén el cuerpo rígido como una tabla",
                day: 2,
                repType: "normal"
            },
            {
                name: "Lunges Alternados",
                series: "3",
                reps: "20",
                weight: "10",
                notes: "10 por pierna, mantén el equilibrio",
                day: 3,
                repType: "normal"
            },
            {
                name: "Plancha Lateral",
                series: "3",
                reps: "30s",
                weight: "",
                notes: "15s por lado, mantén la cadera elevada",
                day: 3,
                repType: "normal"
            }
        ],
        notes: "Rutina progresiva. Enfócate en la técnica antes que en el peso."
    },
    {
        name: "Fuerza Resistencia 4 Días - Intermedio",
        description: "Rutina que combina fuerza y resistencia muscular con series de alta repetición y descansos cortos.",
        trainingObjective: "fuerza_resistencia",
        level: "intermedio",
        daysPerWeek: 4,
        gender: "unisex",
        duration: "55-70 min",
        exercises: [
            {
                name: "Sentadillas con Pausa",
                series: "4",
                reps: "20",
                weight: "40",
                notes: "Pausa de 2 segundos en la posición más baja",
                day: 1,
                repType: "normal"
            },
            {
                name: "Press de Banca con Tempo",
                series: "4",
                reps: "15",
                weight: "35",
                notes: "Tempo 3-1-2-1 (bajada-pausa-subida-pausa)",
                day: 1,
                repType: "normal"
            },
            {
                name: "Peso Muerto Sumo",
                series: "4",
                reps: "18",
                weight: "45",
                notes: "Enfócate en la activación de glúteos",
                day: 2,
                repType: "normal"
            },
            {
                name: "Remo con Mancuernas",
                series: "4",
                reps: "16",
                weight: "20",
                notes: "Alternado, mantén el core estable",
                day: 2,
                repType: "normal"
            },
            {
                name: "Flexiones Diamante",
                series: "3",
                reps: "12",
                weight: "",
                notes: "Si es muy difícil, hazlas desde rodillas",
                day: 3,
                repType: "normal"
            },
            {
                name: "Plancha con Elevación",
                series: "3",
                reps: "45s",
                weight: "",
                notes: "Alterna elevación de brazos y piernas",
                day: 4,
                repType: "normal"
            }
        ],
        notes: "Descansos de 45-60 segundos entre series. Mantén la intensidad alta."
    },
    {
        name: "Potencia 3 Días - Avanzado",
        description: "Rutina de potencia explosiva con movimientos pliométricos y levantamientos olímpicos.",
        trainingObjective: "potencia",
        level: "avanzado",
        daysPerWeek: 3,
        gender: "unisex",
        duration: "70-85 min",
        exercises: [
            {
                name: "Sentadilla con Salto",
                series: "5",
                reps: "6",
                weight: "20",
                notes: "Explosividad máxima en cada repetición",
                day: 1,
                repType: "normal"
            },
            {
                name: "Press de Banca Explosivo",
                series: "5",
                pyramidalReps: "6, 5, 4, 3, 2",
                weight: "50-70",
                notes: "Fase concéntrica explosiva, control en excéntrica",
                day: 1,
                repType: "pyramidal"
            },
            {
                name: "Cargada de Potencia",
                series: "5",
                reps: "3",
                weight: "60",
                notes: "Técnica perfecta, explosividad en la segunda tirada",
                day: 2,
                repType: "normal"
            },
            {
                name: "Box Jumps Altos",
                series: "4",
                reps: "5",
                weight: "",
                notes: "Altura máxima, aterrizaje suave",
                day: 2,
                repType: "normal"
            },
            {
                name: "Medicine Ball Slams",
                series: "4",
                reps: "8",
                weight: "12",
                notes: "Explosividad total, involucra todo el cuerpo",
                day: 3,
                repType: "normal"
            },
            {
                name: "Sprint en Cinta",
                series: "6",
                reps: "15s",
                weight: "",
                notes: "Máxima velocidad, descanso completo entre series",
                day: 3,
                repType: "normal"
            }
        ],
        notes: "Calentamiento extenso obligatorio. Descansos completos entre series (3-5 min)."
    },
    {
        name: "Movilidad 2 Días - Todos los Niveles",
        description: "Rutina de movilidad y flexibilidad para mejorar el rango de movimiento y prevenir lesiones.",
        trainingObjective: "movilidad",
        level: "principiante",
        daysPerWeek: 2,
        gender: "unisex",
        duration: "30-45 min",
        exercises: [
            {
                name: "Estiramiento de Cadera",
                series: "3",
                reps: "30s",
                weight: "",
                notes: "Mantén la posición, respira profundo",
                day: 1,
                repType: "normal"
            },
            {
                name: "Movilidad de Hombros",
                series: "3",
                reps: "15",
                weight: "",
                notes: "Círculos amplios, adelante y atrás",
                day: 1,
                repType: "normal"
            },
            {
                name: "Estiramiento de Isquiotibiales",
                series: "3",
                reps: "45s",
                weight: "",
                notes: "Cada pierna, no fuerces el estiramiento",
                day: 1,
                repType: "normal"
            },
            {
                name: "Rotación de Columna",
                series: "3",
                reps: "10",
                weight: "",
                notes: "Movimiento controlado, cada lado",
                day: 2,
                repType: "normal"
            },
            {
                name: "Estiramiento de Cuádriceps",
                series: "3",
                reps: "30s",
                weight: "",
                notes: "Mantén el equilibrio, cada pierna",
                day: 2,
                repType: "normal"
            },
            {
                name: "Yoga Flow Básico",
                series: "2",
                reps: "5 min",
                weight: "",
                notes: "Secuencia fluida, conecta con la respiración",
                day: 2,
                repType: "normal"
            }
        ],
        notes: "Nunca fuerces los estiramientos. Mantén respiración constante y profunda."
    }
];
async function createBaseTemplates() {
    try {
        console.log('🌱 Creando plantillas base...');
        // Buscar un usuario TRAINER para asignar como creador
        const trainer = await prisma.user.findFirst({
            where: { role: 'TRAINER' }
        });
        if (!trainer) {
            console.error('❌ No se encontró ningún entrenador en la base de datos');
            console.log('💡 Crea un usuario con rol TRAINER primero');
            return;
        }
        console.log(`👨‍💼 Usando entrenador: ${trainer.name} (${trainer.email})`);
        // Crear cada plantilla
        for (const template of baseTemplates) {
            const created = await prisma.routineTemplate.create({
                data: {
                    ...template,
                    createdBy: trainer.id
                }
            });
            console.log(`✅ Plantilla creada: ${created.name}`);
        }
        console.log('🎉 Todas las plantillas base han sido creadas exitosamente!');
    }
    catch (error) {
        console.error('❌ Error al crear las plantillas base:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Ejecutar si se llama directamente
if (require.main === module) {
    createBaseTemplates();
}
