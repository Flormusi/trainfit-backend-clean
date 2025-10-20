const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateToken() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'magagroca@gmail.com' }
    });

    if (!user) {
      console.error('Usuario no encontrado');
      return;
    }

    // Crear el payload del token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // Generar el token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    console.log('Token JWT generado:');
    console.log(token);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateToken();