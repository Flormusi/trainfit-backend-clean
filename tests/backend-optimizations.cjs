require('ts-node').register({ transpileOnly: true });
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const prisma = require('../src/utils/prisma').default;
const { lookupExercises, lookupRoutineExercises } = require('../src/services/exerciseLookup');
const { requestLogging } = require('../src/middleware/requestLogging');

test('email delivery reports configuration and provider failures instead of simulating success', async () => {
  const { EmailService } = require('../src/services/emailService');
  const saved = {
    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS
  };
  const originalTransporter = EmailService.transporter;
  const originalWarn = console.warn;
  const originalError = console.error;
  const logs = [];
  console.warn = message => logs.push(message);
  console.error = message => logs.push(message);

  try {
    delete process.env.EMAIL_SERVICE;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    EmailService.transporter = null;
    assert.equal(await EmailService.sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' }), false);

    process.env.EMAIL_USER = 'configured@example.com';
    process.env.EMAIL_PASS = 'SECRET';
    EmailService.transporter = { sendMail: async () => { const error = new Error('SECRET'); error.code = 'EAUTH'; throw error; } };
    assert.equal(await EmailService.sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' }), false);
    assert.equal(JSON.stringify(logs).includes('SECRET'), false);

    EmailService.transporter = { sendMail: async () => ({ messageId: 'sent' }) };
    assert.equal(await EmailService.sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' }), true);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    EmailService.transporter = originalTransporter;
    console.warn = originalWarn;
    console.error = originalError;
  }
});

test('manual routine email endpoint returns an error and creates no success notification when delivery fails', async () => {
  const { EmailService } = require('../src/services/emailService');
  const originals = {
    relation: prisma.trainerClient.findFirst,
    routine: prisma.routine.findUnique,
    assignment: prisma.routineAssignment.findFirst,
    notification: prisma.notification.create,
    send: EmailService.sendRoutineAssignmentEmail
  };
  let notificationCreated = false, body, status;
  prisma.trainerClient.findFirst = async () => ({ client: { name: 'Client', email: 'client@example.com' } });
  prisma.routine.findUnique = async () => ({ id: 'routine', trainerId: 'trainer', name: 'Routine' });
  prisma.routineAssignment.findFirst = async () => ({
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: new Date('2026-02-01T00:00:00Z')
  });
  prisma.notification.create = async () => { notificationCreated = true; };
  EmailService.sendRoutineAssignmentEmail = async () => false;

  try {
    const { resendRoutineEmail } = require('../src/controllers/trainerController');
    await resendRoutineEmail(
      { user: { id: 'trainer', role: 'TRAINER', name: 'Trainer' }, params: { clientId: 'client', routineId: 'routine' } },
      { status(code) { status = code; return this; }, json(value) { body = value; } }
    );
    assert.equal(status, 502);
    assert.equal(body.success, false);
    assert.equal(notificationCreated, false);
  } finally {
    prisma.trainerClient.findFirst = originals.relation;
    prisma.routine.findUnique = originals.routine;
    prisma.routineAssignment.findFirst = originals.assignment;
    prisma.notification.create = originals.notification;
    EmailService.sendRoutineAssignmentEmail = originals.send;
  }
});

test('batch lookup: ID first, fallback names, deduplication and trainer scope', async () => {
  const calls = [];
  const original = prisma.exercise.findMany;
  prisma.exercise.findMany = async args => {
    calls.push(args);
    assert.equal(args.where.trainerId, 'trainer-a');
    return args.where.id
      ? [{ id: 'a', name: 'ID wins', trainerId: 'trainer-a' }]
      : [{ id: 'b', name: 'Sentadilla', trainerId: 'trainer-a' }];
  };
  try {
    const exercises = Array.from({ length: 10 }, (_, i) => ({ exerciseId: i % 2 ? 'missing' : 'a', name: 'sentadilla' }));
    const result = await lookupExercises(exercises, 'trainer-a');
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].where.id.in, ['a', 'missing']);
    assert.equal(calls[1].where.OR.length, 1);
    exercises.forEach((ex, i) => assert.equal(result.get(ex).id, i % 2 ? 'b' : 'a'));
  } finally { prisma.exercise.findMany = original; }
});

test('complete exercises and empty input do not query; no owner fails closed', async () => {
  const original = prisma.exercise.findMany;
  prisma.exercise.findMany = async () => { throw Error('unexpected query'); };
  try {
    assert.equal((await lookupExercises([], 'a')).size, 0);
    assert.equal((await lookupExercises([{ imageUrl: 'url', description: 'desc' }], 'a')).size, 0);
    assert.equal((await lookupExercises([{ name: 'test' }], '')).size, 0);
  } finally { prisma.exercise.findMany = original; }
});

test('exact case-insensitive name preferred; partial fallback and missing names retained', async () => {
  const original = prisma.exercise.findMany;
  prisma.exercise.findMany = async () => [{ id: '1', name: 'Sentadilla copa' }, { id: '2', name: 'Sentadilla' }];
  try {
    const exact = { name: 'SENTADILLA' }, partial = { name: 'copa' }, missing = { name: 'absent' };
    const result = await lookupExercises([exact, partial, missing], 'a');
    assert.equal(result.get(exact).id, '2');
    assert.equal(result.get(partial).id, '1');
    assert.equal(result.has(missing), false);
  } finally { prisma.exercise.findMany = original; }
});

test('routine collections batch all exercises per trainer and preserve exact legacy matching', async () => {
  const calls = [];
  const original = prisma.exercise.findMany;
  prisma.exercise.findMany = async args => {
    calls.push(args);
    if (args.where.id) return [];
    return [{ id: `match-${args.where.trainerId}`, name: 'Exact', trainerId: args.where.trainerId }];
  };
  try {
    const routines = [
      { trainerId: 'trainer-a', exercises: Array.from({ length: 5 }, () => ({ exerciseId: 'missing', name: 'Exact', imageUrl: 'old', description: 'old' })) },
      { trainerId: 'trainer-a', exercises: Array.from({ length: 5 }, () => ({ exerciseId: 'missing', name: 'Exact' })) },
      { trainerId: 'trainer-b', exercises: [{ name: 'Exact' }] }
    ];
    const result = await lookupRoutineExercises(routines, { skipComplete: false, nameMode: 'equals' });
    assert.equal(calls.length, 3);
    assert.equal(calls.filter(call => call.where.trainerId === 'trainer-a').length, 2);
    assert.equal(calls.filter(call => call.where.trainerId === 'trainer-b').length, 1);
    assert.ok(calls.filter(call => call.where.OR).every(call => call.where.OR[0].name.equals === 'Exact'));
    assert.equal(result.size, 11);
  } finally { prisma.exercise.findMany = original; }
});

test('trainer routine list keeps its array response while batching exercise names', async () => {
  const originals = { routines: prisma.routine.findMany, exercises: prisma.exercise.findMany };
  let lookupCalls = 0, body, status;
  prisma.routine.findMany = async () => [
    { id: 'r1', trainerId: 'trainer-a', exercises: Array.from({ length: 5 }, () => ({ name: 'Exact' })) },
    { id: 'r2', trainerId: 'trainer-a', exercises: Array.from({ length: 5 }, () => ({ name: 'Exact' })) }
  ];
  prisma.exercise.findMany = async args => {
    lookupCalls += 1;
    assert.equal(args.where.trainerId, 'trainer-a');
    return [{ id: 'exercise', trainerId: 'trainer-a', name: 'Exact', imageUrl: 'photo' }];
  };
  try {
    const { getRoutines } = require('../src/controllers/trainerController');
    await getRoutines(
      { user: { id: 'trainer-a', role: 'TRAINER' } },
      { status(code) { status = code; return this; }, json(value) { body = value; } }
    );
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 2);
    assert.equal(body[0].exercises[0].imageUrl, 'photo');
    assert.equal(lookupCalls, 1);
  } finally {
    prisma.routine.findMany = originals.routines;
    prisma.exercise.findMany = originals.exercises;
  }
});

test('client routine list keeps its data envelope while batching exercise names', async () => {
  const originals = { routines: prisma.routine.findMany, exercises: prisma.exercise.findMany };
  let lookupCalls = 0, body, status;
  prisma.routine.findMany = async () => [
    { id: 'r1', trainerId: 'trainer-a', exercises: Array.from({ length: 10 }, () => ({ name: 'Exact' })) }
  ];
  prisma.exercise.findMany = async args => {
    lookupCalls += 1;
    assert.equal(args.where.trainerId, 'trainer-a');
    return [{ id: 'exercise', trainerId: 'trainer-a', name: 'Exact', imageUrl: 'photo' }];
  };
  try {
    const { getClientRoutines } = require('../src/controllers/client.controller');
    await getClientRoutines(
      { user: { id: 'trainer-a', role: 'TRAINER' }, params: {} },
      { status(code) { status = code; return this; }, json(value) { body = value; } }
    );
    assert.equal(status, 200);
    assert.deepEqual(Object.keys(body), ['data']);
    assert.equal(body.data[0].exercises[0].imageUrl, 'photo');
    assert.equal(lookupCalls, 1);
  } finally {
    prisma.routine.findMany = originals.routines;
    prisma.exercise.findMany = originals.exercises;
  }
});

test('request logs contain only safe fields and a route template, never raw URLs', () => {
  const res = new EventEmitter();
  res.statusCode = 401;
  res.setHeader = () => {};
  const lines = [], original = console.info;
  console.info = line => lines.push(line);
  try {
    const req = { method: 'POST', originalUrl: '/join/SECRET?code=SECRET', headers: { authorization: 'SECRET', cookie: 'SECRET' }, body: { password: 'SECRET' }, route: { path: '/join/:token' } };
    requestLogging(req, res, () => {});
    res.emit('finish');
    assert.equal(lines.length, 1);
    assert.equal(lines[0].includes('SECRET'), false);
    const log = JSON.parse(lines[0]);
    assert.deepEqual(Object.keys(log).sort(), ['durationMs', 'method', 'requestId', 'route', 'status']);
    assert.equal(log.route, '/join/:token');
    assert.equal(log.status, 401);
    assert.ok(log.durationMs >= 0);
  } finally { console.info = original; }
});

test('routine detail preserves response fields, weights and authorization', async () => {
  const originals = { routine: prisma.routine.findFirst, exercise: prisma.exercise.findMany, assignment: prisma.routineAssignment.findFirst };
  const exercise = { id: 'local', exerciseId: 'db', name: 'Squat', weight: '10-20', weeks: { week1: { peso: '15' } }, clientWeekWeights: { week1: '17' }, inCircuit: true };
  prisma.routine.findFirst = async args => {
    assert.equal(args.where.clientId, 'client');
    return { id: 'routine', trainerId: 'trainer', exercises: [exercise] };
  };
  prisma.exercise.findMany = async args => {
    assert.equal(args.where.trainerId, 'trainer');
    return [{ id: 'db', name: 'Squat', imageUrl: 'photo', description: 'desc' }];
  };
  const { getRoutineDetailsForClient } = require('../src/controllers/routine.controller');
  let body, status;
  const res = { status(code) { status = code; return this; }, json(value) { body = value; } };
  try {
    await getRoutineDetailsForClient({ user: { id: 'client' }, params: { id: 'routine' } }, res);
    assert.equal(status, 200);
    assert.deepEqual(Object.keys(body), ['data']);
    const ex = body.data.exercises[0];
    assert.equal(ex.image_url, 'photo');
    assert.equal(ex.imageUrl, 'photo');
    assert.deepEqual(ex.weightsPerSeries, [10, 20]);
    assert.deepEqual(ex.weeks, exercise.weeks);
    assert.deepEqual(ex.clientWeekWeights, exercise.clientWeekWeights);
    assert.equal(ex.inCircuit, true);
    prisma.routine.findFirst = async () => null;
    prisma.routineAssignment.findFirst = async () => null;
    await getRoutineDetailsForClient({ user: { id: 'client' }, params: { id: 'other' } }, res);
    assert.equal(status, 404);
  } finally {
    prisma.routine.findFirst = originals.routine;
    prisma.exercise.findMany = originals.exercise;
    prisma.routineAssignment.findFirst = originals.assignment;
  }
});

test('assigned workouts keep the original envelope and do not expose internal trainerId', async () => {
  const original = prisma.routine.findMany, lookup = prisma.exercise.findMany;
  prisma.routine.findMany = async () => [{ id: 'r', trainerId: 't', exercises: [{ name: 'Custom', image_url: 'old' }] }];
  prisma.exercise.findMany = async () => [];
  let body;
  try {
    const { getAssignedWorkouts } = require('../src/controllers/clientProfile.controller');
    await getAssignedWorkouts({ user: { id: 'client' } }, { status() { return this; }, json(value) { body = value; } });
    assert.equal(body.success, true);
    assert.equal('trainerId' in body.data[0], false);
    assert.equal(body.data[0].exercises[0].imageUrl, 'old');
    assert.equal(body.data[0].exercises[0].image_url, 'old');
  } finally { prisma.routine.findMany = original; prisma.exercise.findMany = lookup; }
});

test('lookup failure returns original exercise payload instead of breaking the detail', async () => {
  const original = prisma.routine.findFirst, lookup = prisma.exercise.findMany;
  const exercise = { name: 'Custom', weeks: { week2: { peso: '0' } }, rpe: 7 };
  prisma.routine.findFirst = async () => ({ id: 'r', trainerId: 't', exercises: [exercise] });
  prisma.exercise.findMany = async () => { throw Error('SECRET DB ERROR'); };
  const logs = [], log = console.error;
  console.error = (...args) => logs.push(args);
  let body;
  try {
    const { getRoutineDetailsForClient } = require('../src/controllers/routine.controller');
    await getRoutineDetailsForClient({ user: { id: 'client' }, params: { id: 'r' } }, { status() { return this; }, json(value) { body = value; } });
    assert.deepEqual(body.data.exercises, [exercise]);
    assert.equal(JSON.stringify(logs).includes('SECRET'), false);
  } finally { prisma.routine.findFirst = original; prisma.exercise.findMany = lookup; console.error = log; }
});

test('assigned routine detail uses the routine owner and retains assignment metadata', async () => {
  const original = prisma.routine.findFirst, assignment = prisma.routineAssignment.findFirst, lookup = prisma.exercise.findMany;
  prisma.routine.findFirst = async () => null;
  prisma.routineAssignment.findFirst = async args => {
    assert.equal(args.where.clientId, 'client');
    assert.ok(args.where.endDate.gte instanceof Date);
    return { id: 'assignment', startDate: 'start', endDate: 'end', assignedDate: 'assigned', routine: { id: 'r', trainerId: 'owner', exercises: [{ name: 'Custom' }] } };
  };
  prisma.exercise.findMany = async args => { assert.equal(args.where.trainerId, 'owner'); return []; };
  let body;
  try {
    const { getRoutineDetailsForClient } = require('../src/controllers/routine.controller');
    await getRoutineDetailsForClient({ user: { id: 'client' }, params: { id: 'r' } }, { status() { return this; }, json(value) { body = value; } });
    assert.equal(body.data.assignmentId, 'assignment');
    assert.equal(body.data.startDate, 'start');
    assert.equal(body.data.exercises[0].image_url, null);
  } finally { prisma.routine.findFirst = original; prisma.routineAssignment.findFirst = assignment; prisma.exercise.findMany = lookup; }
});

test('active dependency graph has one Prisma constructor and no payload logging', () => {
  const fs = require('fs'), path = require('path'), ts = require('typescript');
  const visited = new Set(), constructors = [], unsafeLogs = [];
  function scan(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isNewExpression(node) && node.expression.getText(source) === 'PrismaClient') constructors.push(file);
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
          && ['console', 'logger'].includes(node.expression.expression.getText(source))
          && ['log', 'error', 'warn', 'info', 'debug'].includes(node.expression.name.text)
          && !file.endsWith('requestLogging.ts')) {
        if (node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0])) unsafeLogs.push(file);
      }
      if (ts.isImportDeclaration(node) && node.moduleSpecifier.text.startsWith('.')) {
        const base = path.resolve(path.dirname(file), node.moduleSpecifier.text);
        const target = [base + '.ts', base + '.js', path.join(base, 'index.ts')].find(p => fs.existsSync(p));
        if (target) scan(target);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  scan(path.resolve(__dirname, '../src/server.ts'));
  assert.deepEqual(constructors, [path.resolve(__dirname, '../src/utils/prisma.ts')]);
  assert.deepEqual(unsafeLogs, []);
});
