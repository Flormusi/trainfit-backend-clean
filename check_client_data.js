const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClientData() {
  try {
    console.log('🔍 Verificando datos del cliente...\n');
    
    // Buscar el cliente de prueba
    const client = await prisma.user.findUnique({
      where: { email: "client.test@trainfit.com" },
      include: {
        clientProfile: true
      }
    });

    if (!client) {
      console.log('❌ Cliente no encontrado');
      return;
    }

    console.log('👤 DATOS DEL CLIENTE:');
    console.log('ID:', client.id);
    console.log('Nombre:', client.name);
    console.log('Email:', client.email);
    console.log('Teléfono:', client.phone);
    console.log('Peso:', client.weight);
    console.log('Altura:', client.height);
    console.log('Edad (campo directo):', client.age);
    console.log('Género (campo directo):', client.gender);
    console.log('Nivel de fitness (campo directo):', client.fitnessLevel);
    console.log('Objetivos:', client.goals);
    console.log('Objetivo inicial:', client.initialGoal);
    console.log('Días de entrenamiento por semana:', client.trainingDaysPerWeek);
    console.log('Condiciones médicas:', client.medicalConditions);
    console.log('Medicamentos:', client.medications);
    console.log('Lesiones:', client.injuries);

    console.log('\n📋 PERFIL DEL CLIENTE:');
    if (client.clientProfile) {
      console.log('ID del perfil:', client.clientProfile.id);
      console.log('Edad (perfil):', client.clientProfile.age);
      console.log('Género (perfil):', client.clientProfile.gender);
      console.log('Nivel de fitness (perfil):', client.clientProfile.fitnessLevel);
      console.log('Peso (perfil):', client.clientProfile.weight);
      console.log('Altura (perfil):', client.clientProfile.height);
      console.log('Objetivos (perfil):', client.clientProfile.goals);
      console.log('Objetivo inicial (perfil):', client.clientProfile.initialGoal);
      console.log('Días de entrenamiento (perfil):', client.clientProfile.trainingDaysPerWeek);
      console.log('Condiciones médicas (perfil):', client.clientProfile.medicalConditions);
      console.log('Medicamentos (perfil):', client.clientProfile.medications);
      console.log('Lesiones (perfil):', client.clientProfile.injuries);
    } else {
      console.log('❌ No tiene perfil de cliente');
    }



  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientData();