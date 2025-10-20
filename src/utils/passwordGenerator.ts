/**
 * Genera una contraseña temporal segura para nuevos clientes
 * @param length - Longitud de la contraseña (por defecto 12 caracteres)
 * @returns Contraseña temporal generada
 */
export const generateTemporaryPassword = (length: number = 12): string => {
  // Caracteres permitidos (sin caracteres ambiguos como 0, O, l, I)
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*+-=';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Asegurar que la contraseña tenga al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar el resto de la contraseña
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres para que no sigan un patrón predecible
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Valida si una contraseña cumple con los requisitos mínimos de seguridad
 * @param password - Contraseña a validar
 * @returns true si la contraseña es válida, false en caso contrario
 */
export const validatePassword = (password: string): boolean => {
  // Mínimo 8 caracteres
  if (password.length < 8) return false;
  
  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) return false;
  
  // Al menos una minúscula
  if (!/[a-z]/.test(password)) return false;
  
  // Al menos un número
  if (!/[0-9]/.test(password)) return false;
  
  // Al menos un carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  
  return true;
};

/**
 * Genera múltiples contraseñas temporales y selecciona la más segura
 * @param count - Número de contraseñas a generar para seleccionar la mejor
 * @param length - Longitud de cada contraseña
 * @returns La contraseña más segura generada
 */
export const generateSecureTemporaryPassword = (count: number = 5, length: number = 12): string => {
  const passwords = [];
  
  for (let i = 0; i < count; i++) {
    let password = generateTemporaryPassword(length);
    
    // Asegurar que la contraseña generada sea válida
    while (!validatePassword(password)) {
      password = generateTemporaryPassword(length);
    }
    
    passwords.push(password);
  }
  
  // Seleccionar la contraseña con mayor diversidad de caracteres
  return passwords.reduce((best, current) => {
    const bestScore = calculatePasswordComplexity(best);
    const currentScore = calculatePasswordComplexity(current);
    return currentScore > bestScore ? current : best;
  });
};

/**
 * Calcula la complejidad de una contraseña basada en la diversidad de caracteres
 * @param password - Contraseña a evaluar
 * @returns Puntuación de complejidad
 */
const calculatePasswordComplexity = (password: string): number => {
  let score = 0;
  
  // Puntos por longitud
  score += password.length;
  
  // Puntos por diversidad de caracteres
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (hasUppercase) score += 5;
  if (hasLowercase) score += 5;
  if (hasNumbers) score += 5;
  if (hasSymbols) score += 10;
  
  // Puntos por variedad de caracteres únicos
  const uniqueChars = new Set(password.split(''));
  score += uniqueChars.size * 2;
  
  return score;
};

/**
 * Formatea una contraseña para mostrarla de manera más legible
 * @param password - Contraseña a formatear
 * @returns Contraseña formateada con separadores cada 4 caracteres
 */
export const formatPasswordForDisplay = (password: string): string => {
  return password.match(/.{1,4}/g)?.join('-') || password;
};