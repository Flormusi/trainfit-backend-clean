import { Exercise } from '@prisma/client';
import prisma from '../utils/prisma';

// Preserve the legacy case-insensitive contains lookup (including LIKE wildcards).
const matchesName = (candidate: string, name: string): boolean => {
  const pattern = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*').replace(/_/g, '.');
  return new RegExp(pattern, 'iu').test(candidate);
};

type LookupOptions = {
  skipComplete?: boolean;
  nameMode?: 'contains' | 'equals';
};

export async function lookupExercises(
  exercises: any[],
  trainerId: string,
  { skipComplete = true, nameMode = 'contains' }: LookupOptions = {}
): Promise<Map<any, Exercise>> {
  const result = new Map<any, Exercise>();
  if (!trainerId) return result;
  const pending = exercises.filter(ex => ex && (!skipComplete || !(ex.imageUrl && ex.description)));
  const ids = [...new Set<string>(pending.map(ex => ex.exerciseId).filter(id => typeof id === 'string' && id.length > 0))];
  const byId = new Map<string, Exercise>();
  if (ids.length) {
    const rows = await prisma.exercise.findMany({ where: { trainerId, id: { in: ids } } });
    rows.forEach(row => byId.set(row.id, row));
  }
  const names = [...new Set<string>(pending.filter(ex => !byId.has(ex.exerciseId))
    .map(ex => ex.name || ex.exerciseId).filter(name => typeof name === 'string' && name.length > 0))];
  const byName = new Map<string, Exercise>();
  if (names.length) {
    const rows = await prisma.exercise.findMany({
      where: {
        trainerId,
        OR: names.map(name => ({
          name: nameMode === 'equals'
            ? { equals: name, mode: 'insensitive' as const }
            : { contains: name, mode: 'insensitive' as const }
        }))
      },
      orderBy: { id: 'asc' }
    });
    for (const name of names) {
      const match = rows.find(row => row.name.toLowerCase() === name.toLowerCase())
        || (nameMode === 'contains' ? rows.find(row => matchesName(row.name, name)) : undefined);
      if (match) byName.set(name, match);
    }
  }
  pending.forEach(ex => {
    const match = byId.get(ex.exerciseId) || byName.get(ex.name || ex.exerciseId);
    if (match) result.set(ex, match);
  });
  return result;
}

export async function lookupRoutineExercises(
  routines: any[],
  options: LookupOptions = {}
): Promise<Map<any, Exercise>> {
  const exercisesByTrainer = new Map<string, any[]>();

  for (const routine of routines) {
    if (!routine?.trainerId || !Array.isArray(routine.exercises)) continue;
    const exercises = exercisesByTrainer.get(routine.trainerId) || [];
    exercises.push(...routine.exercises);
    exercisesByTrainer.set(routine.trainerId, exercises);
  }

  const result = new Map<any, Exercise>();
  await Promise.all([...exercisesByTrainer.entries()].map(async ([trainerId, exercises]) => {
    const matches = await lookupExercises(exercises, trainerId, options);
    matches.forEach((exercise, source) => result.set(source, exercise));
  }));

  return result;
}
