import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateTrainerRoles() {
  const trainers = [
    {
      email: 'magagroca@gmail.com',
      name: 'Magalí Groca',
      password: 'magaroca'
    },
    {
      email: 'ntrenoafondo@gmail.com',
      name: 'N Treno',
      password: 'rodriroca'
    }
  ];

  try {
    for (const trainer of trainers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: trainer.email }
      });

      if (existingUser) {
        const hashedPassword = await bcrypt.hash(trainer.password, 10);
        const updatedUser = await prisma.user.update({
          where: { email: trainer.email },
          data: { 
            role: 'TRAINER',
            password: hashedPassword
          }
        });
        console.log(`Updated existing user ${trainer.email} with new password and TRAINER role`);
      } else {
        const hashedPassword = await bcrypt.hash(trainer.password, 10);
        const newUser = await prisma.user.create({
          data: {
            email: trainer.email,
            name: trainer.name,
            password: hashedPassword,
            role: 'TRAINER'
          }
        });
        console.log(`Created new user ${trainer.email} with TRAINER role`);
      }
    }
    console.log('Role and password update/creation completed successfully');
  } catch (error) {
    console.error('Error updating/creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTrainerRoles();