const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrainerRelation() {
  try {
    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email: 'florenciamusitani@gmail.com' }
    });
    
    if (!user) {
      console.log('Usuario no encontrado');
      return;
    }
    
    console.log('ID del cliente:', user.id);
    
    // Buscar relaciones trainer-client para este cliente
    const trainerRelations = await prisma.trainerClient.findMany({
      where: { clientId: user.id },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (trainerRelations.length === 0) {
      console.log('El cliente no está asociado a ningún entrenador');
    } else {
      console.log(`El cliente está asociado a ${trainerRelations.length} entrenador(es):`);
      trainerRelations.forEach((relation, index) => {
        console.log(`Entrenador ${index + 1}:`, relation.trainer);
      });
    }
  } catch (error) {
    console.error('Error al verificar relación con entrenador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainerRelation();