#!/bin/bash

echo "🔐 Iniciando sesión..."

# Hacer login y obtener token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer.test@trainfit.com","password":"test123"}')

echo "Login response: $LOGIN_RESPONSE"

# Extraer token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ No se pudo obtener el token"
  exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:20}..."

# Obtener primer cliente ID
CLIENTS_RESPONSE=$(curl -s -X GET http://localhost:5002/api/trainer/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

CLIENT_ID=$(echo $CLIENTS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ]; then
  echo "❌ No se encontraron clientes"
  exit 1
fi

echo "✅ Cliente ID encontrado: $CLIENT_ID"

echo ""
echo "🔄 Actualizando cliente con nuevos datos..."

# Actualizar cliente con datos completos
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:5002/api/trainer/clients/$CLIENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cliente de Prueba Actualizado",
    "email": "client.test@trainfit.com",
    "phone": "+1234567890",
    "age": 28,
    "gender": "MALE",
    "fitnessLevel": "INTERMEDIATE",
    "weight": 75.5,
    "height": 180,
    "goals": ["Ganar músculo", "Fuerza"],
    "initialObjective": "Mejorar fuerza y masa muscular",
    "trainingDaysPerWeek": 4,
    "medicalConditions": "Ninguna",
    "medications": "Ninguna",
    "injuries": "Ninguna"
  }')

echo "Update response: $UPDATE_RESPONSE"

echo ""
echo "🔍 Verificando datos actualizados..."

# Obtener detalles actualizados del cliente
CLIENT_DETAILS=$(curl -s -X GET http://localhost:5002/api/trainer/clients/$CLIENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo ""
echo "📊 DATOS ACTUALIZADOS DEL CLIENTE:"
echo "====================================="
echo "$CLIENT_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$CLIENT_DETAILS"

echo ""
echo "✅ Prueba de actualización completada"