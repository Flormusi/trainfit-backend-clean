const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFlorenciaProfile() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'florenciamusitani@gmail.com' },
      include: {
        clientProfile: true
      }
    });
    
    console.log('=== USUARIO ENCONTRADO ===');
    console.log('ID:', user?.id);
    console.log('Nombre:', user?.name);
    console.log('Email:', user?.email);
    console.log('Rol:', user?.role);
    
    if (user?.clientProfile) {
      console.log('\n=== PERFIL DEL CLIENTE ===');
      console.log('Peso:', user.clientProfile.weight);
      console.log('Altura:', user.clientProfile.height);
      console.log('Edad:', user.clientProfile.age);
      console.log('Género:', user.clientProfile.gender);
      console.log('Nivel de fitness:', user.clientProfile.fitnessLevel);
      console.log('Objetivo inicial:', user.clientProfile.initialObjective);
      console.log('Días de entrenamiento por semana:', user.clientProfile.trainingDaysPerWeek);
      console.log('Objetivos:', user.clientProfile.goals);
      console.log('Teléfono:', user.clientProfile.phone);
      console.log('Condiciones médicas:', user.clientProfile.medicalConditions);
      console.log('Medicamentos:', user.clientProfile.medications);
      console.log('Lesiones:', user.clientProfile.injuries);
    } else {
      console.log('\n❌ NO TIENE PERFIL DE CLIENTE');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFlorenciaProfile();