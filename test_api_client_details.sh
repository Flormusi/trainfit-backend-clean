#!/bin/bash

echo "🔍 Probando API de detalles del cliente..."

# Hacer login
echo "📝 Haciendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer.test@trainfit.com",
    "password": "test123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extraer token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:20}..."

# Obtener detalles del cliente
echo ""
echo "📋 Obteniendo detalles del cliente..."
CLIENT_DETAILS=$(curl -s -X GET "http://localhost:5002/api/trainer/clients/cmdm9rl0l0001f5xbjlr0wwm2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Client details response:"
echo $CLIENT_DETAILS

echo ""
echo "🔍 Verificando si contiene los datos esperados:"
echo $CLIENT_DETAILS | grep -o '"age":[^,]*'
echo $CLIENT_DETAILS | grep -o '"gender":[^,]*'
echo $CLIENT_DETAILS | grep -o '"fitnessLevel":[^,]*'