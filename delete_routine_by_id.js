const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';
const ROUTINE_ID = 'cmesmaeoe0001f54eu0bhoxv6'; // ID de "Rutina de Prueba - Reenvío Email"

// Función para hacer login
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'trainer.test@trainfit.com',
      password: 'test123'
    });
    
    if (response.data.token) {
      console.log('✅ Login exitoso');
      return response.data.token;
    } else {
      throw new Error('No se recibió token');
    }
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Función para eliminar rutina por ID
async function deleteRoutineById(token, routineId) {
  try {
    console.log(`🎯 Intentando eliminar rutina con ID: ${routineId}`);
    
    const deleteResponse = await axios.delete(`${BASE_URL}/trainer/routines/${routineId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (deleteResponse.status === 204) {
      console.log(`✅ Rutina eliminada exitosamente`);
      return true;
    } else {
      console.log(`❌ Error eliminando rutina. Status: ${deleteResponse.status}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error eliminando rutina:', error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
      console.log('ℹ️  La rutina no existe o no tienes permisos para eliminarla');
    }
    return false;
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando eliminación de rutina específica por ID...');
    
    // Login
    const token = await login();
    
    // Eliminar la rutina específica
    const success = await deleteRoutineById(token, ROUTINE_ID);
    
    if (success) {
      console.log('🎉 Rutina "Rutina de Prueba - Reenvío Email" eliminada exitosamente');
    } else {
      console.log('❌ No se pudo eliminar la rutina');
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

// Ejecutar el script
main();