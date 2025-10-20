// Script de prueba para verificar la corrección del flujo de actualización de pagos
// Ejecutar desde la consola del navegador en la página del cliente

async function testPaymentUpdateFlow() {
  console.log('🧪 Iniciando prueba del flujo de actualización de pagos...');
  
  // Datos de prueba
  const testPaymentData = {
    amount: 150,
    dueDate: '2025-02-15',
    planType: 'PREMIUM', // Usando planType en lugar de plan
    status: 'pending'
  };
  
  try {
    // 1. Obtener el clientId de la URL actual
    const urlParts = window.location.pathname.split('/');
    const clientId = urlParts[urlParts.indexOf('clients') + 1];
    
    if (!clientId) {
      throw new Error('No se pudo obtener el clientId de la URL');
    }
    
    console.log('📋 ClientId obtenido:', clientId);
    console.log('📋 Datos de prueba:', testPaymentData);
    
    // 2. Obtener el estado actual del pago
    console.log('\n🔍 Paso 1: Obteniendo estado actual del pago...');
    const currentStatusResponse = await fetch(`/api/trainer/clients/${clientId}/payment`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const currentStatus = await currentStatusResponse.json();
    console.log('✅ Estado actual:', currentStatus);
    
    // 3. Actualizar el pago
    console.log('\n🔄 Paso 2: Actualizando información de pago...');
    const updateResponse = await fetch(`/api/trainer/clients/${clientId}/payment`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPaymentData)
    });
    
    const updateResult = await updateResponse.json();
    console.log('✅ Respuesta de actualización:', updateResult);
    
    if (!updateResult.success) {
      throw new Error(`Error en actualización: ${updateResult.message}`);
    }
    
    // 4. Verificar que los cambios se reflejaron
    console.log('\n🔍 Paso 3: Verificando cambios...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const newStatusResponse = await fetch(`/api/trainer/clients/${clientId}/payment`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const newStatus = await newStatusResponse.json();
    console.log('✅ Nuevo estado:', newStatus);
    
    // 5. Comparar cambios
    console.log('\n📊 Paso 4: Comparando cambios...');
    const changes = {
      planChanged: currentStatus.data?.plan !== newStatus.data?.plan,
      dueDateChanged: currentStatus.data?.dueDate !== newStatus.data?.dueDate,
      statusChanged: currentStatus.data?.status !== newStatus.data?.status
    };
    
    console.log('📈 Cambios detectados:', changes);
    
    // 6. Verificar que el plan se actualizó correctamente
    if (newStatus.data?.plan === testPaymentData.planType) {
      console.log('✅ ¡ÉXITO! El plan se actualizó correctamente');
    } else {
      console.log('❌ ERROR: El plan no se actualizó correctamente');
      console.log('Esperado:', testPaymentData.planType);
      console.log('Obtenido:', newStatus.data?.plan);
    }
    
    // 7. Verificar que la fecha de vencimiento se actualizó
    const expectedDate = new Date(testPaymentData.dueDate).toISOString();
    const actualDate = new Date(newStatus.data?.dueDate).toISOString();
    
    if (expectedDate.split('T')[0] === actualDate.split('T')[0]) {
      console.log('✅ ¡ÉXITO! La fecha de vencimiento se actualizó correctamente');
    } else {
      console.log('❌ ERROR: La fecha de vencimiento no se actualizó correctamente');
      console.log('Esperado:', expectedDate);
      console.log('Obtenido:', actualDate);
    }
    
    console.log('\n🎉 Prueba completada exitosamente!');
    return {
      success: true,
      currentStatus: currentStatus.data,
      newStatus: newStatus.data,
      changes
    };
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para probar desde el modal
function testFromModal() {
  console.log('🧪 Probando desde el modal de edición...');
  
  // Simular clic en el botón de editar pago
  const editButton = document.querySelector('[data-testid="edit-payment-button"], .edit-payment-btn, button:contains("Editar Pago")');
  
  if (editButton) {
    console.log('✅ Botón de editar encontrado, haciendo clic...');
    editButton.click();
    
    // Esperar a que se abra el modal
    setTimeout(() => {
      const modal = document.querySelector('.modal, .payment-modal, [role="dialog"]');
      if (modal) {
        console.log('✅ Modal abierto correctamente');
        console.log('📋 Puedes ahora editar los valores y guardar para probar el flujo completo');
      } else {
        console.log('❌ No se pudo encontrar el modal');
      }
    }, 500);
  } else {
    console.log('❌ No se pudo encontrar el botón de editar pago');
    console.log('💡 Asegúrate de estar en la página del cliente y en la pestaña de pagos');
  }
}

// Exportar funciones para uso global
window.testPaymentUpdateFlow = testPaymentUpdateFlow;
window.testFromModal = testFromModal;

console.log('🚀 Script de prueba cargado!');
console.log('📋 Funciones disponibles:');
console.log('  - testPaymentUpdateFlow(): Prueba completa del flujo de actualización');
console.log('  - testFromModal(): Abre el modal de edición para prueba manual');
console.log('\n💡 Para ejecutar: testPaymentUpdateFlow()');