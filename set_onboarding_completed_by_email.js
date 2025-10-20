// Script para marcar hasCompletedOnboarding = true por email
// Uso: node set_onboarding_completed_by_email.js <email>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'florenciamusitani@gmail.com';
  console.log(`🔧 Actualizando hasCompletedOnboarding para: ${email}`);

  // Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, hasCompletedOnboarding: true }
  });

  if (!user) {
    console.error('❌ Usuario no encontrado');
    return;
  }

  console.log('👤 Usuario actual:', user);

  // Actualizar flag
  const updated = await prisma.user.update({
    where: { email },
    data: { hasCompletedOnboarding: true },
    select: { id: true, name: true, email: true, role: true, hasCompletedOnboarding: true }
  });

  console.log('✅ Usuario actualizado:', updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });