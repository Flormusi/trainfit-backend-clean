const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeDuplicateTemplates() {
  try {
    console.log('🔍 Buscando plantillas duplicadas...');
    
    // Obtener todas las plantillas ordenadas por fecha de creación (más recientes primero)
    const allTemplates = await prisma.routineTemplate.findMany({
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
    
    console.log(`📊 Total de plantillas encontradas: ${allTemplates.length}`);
    
    // Agrupar por nombre y identificar duplicados
    const templatesByName = {};
    const toDelete = [];
    
    allTemplates.forEach(template => {
      if (!templatesByName[template.name]) {
        // Primera ocurrencia (la más reciente) - mantener
        templatesByName[template.name] = template;
        console.log(`✅ Manteniendo: "${template.name}" (ID: ${template.id})`);
      } else {
        // Duplicado - marcar para eliminar
        toDelete.push(template);
        console.log(`❌ Marcando para eliminar: "${template.name}" (ID: ${template.id})`);
      }
    });
    
    console.log(`\n📋 Resumen:`);
    console.log(`   - Plantillas únicas a mantener: ${Object.keys(templatesByName).length}`);
    console.log(`   - Plantillas duplicadas a eliminar: ${toDelete.length}`);
    
    if (toDelete.length === 0) {
      console.log('✅ No hay duplicados para eliminar');
      return;
    }
    
    console.log('\n🗑️  Eliminando plantillas duplicadas...');
    
    // Eliminar los duplicados uno por uno
    for (const template of toDelete) {
      try {
        await prisma.routineTemplate.delete({
          where: { id: template.id }
        });
        console.log(`✅ Eliminada: "${template.name}" (ID: ${template.id})`);
      } catch (error) {
        console.error(`❌ Error eliminando ${template.id}:`, error.message);
      }
    }
    
    console.log('\n🔍 Verificando resultado final...');
    
    // Verificar el resultado final
    const finalTemplates = await prisma.routineTemplate.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`\n📊 Plantillas restantes: ${finalTemplates.length}`);
    console.log('\n📋 Lista final:');
    finalTemplates.forEach((template, index) => {
      console.log(`${index + 1}. "${template.name}" (ID: ${template.id})`);
    });
    
    console.log('\n✅ Limpieza de duplicados completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicateTemplates();