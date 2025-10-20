const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTemplates() {
  try {
    console.log('🔍 Consultando plantillas en la base de datos...');
    
    const templates = await prisma.routineTemplate.findMany({
      select: {
        id: true,
        name: true,
        createdBy: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 Total de plantillas encontradas: ${templates.length}`);
    console.log('\n📋 Lista de plantillas:');
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. "${template.name}"`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Creado por: ${template.createdBy}`);
      console.log(`   Fecha: ${template.createdAt}`);
      console.log('');
    });
    
    // Verificar duplicados por nombre
    const duplicateNames = {};
    templates.forEach(template => {
      if (duplicateNames[template.name]) {
        duplicateNames[template.name].push(template);
      } else {
        duplicateNames[template.name] = [template];
      }
    });
    
    console.log('\n🔍 Verificando duplicados por nombre:');
    const duplicates = Object.entries(duplicateNames).filter(([name, templates]) => templates.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Se encontraron ${duplicates.length} nombres duplicados:`);
      duplicates.forEach(([name, templates]) => {
        console.log(`\n📝 "${name}" aparece ${templates.length} veces:`);
        templates.forEach((template, index) => {
          console.log(`   ${index + 1}. ID: ${template.id} - Creado: ${template.createdAt}`);
        });
      });
    } else {
      console.log('✅ No se encontraron duplicados por nombre');
    }
    
  } catch (error) {
    console.error('❌ Error consultando la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();