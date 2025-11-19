import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CalendarIntegrationData {
  clientId: string;
  provider: 'google' | 'outlook' | 'icloud';
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope?: string;
  email?: string;
}

export class CalendarIntegrationModel {
  /**
   * Crear nueva integración de calendario para un cliente
   */
  static async create(data: CalendarIntegrationData) {
    return await prisma.calendarIntegration.create({
      data: {
        clientId: data.clientId,
        provider: data.provider,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        scope: data.scope,
        email: data.email,
        isActive: true
      }
    });
  }

  /**
   * Obtener integración activa de un cliente
   */
  static async findByClientId(clientId: string) {
    return await prisma.calendarIntegration.findFirst({
      where: {
        clientId,
        isActive: true
      }
    });
  }

  /**
   * Actualizar tokens de una integración
   */
  static async updateTokens(id: string, accessToken: string, refreshToken: string, expiresAt: Date) {
    return await prisma.calendarIntegration.update({
      where: { id },
      data: {
        accessToken,
        refreshToken,
        expiresAt,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Desactivar integración de calendario
   */
  static async deactivate(clientId: string, provider: string) {
    return await prisma.calendarIntegration.updateMany({
      where: {
        clientId,
        provider,
        isActive: true
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Obtener todas las integraciones activas
   */
  static async findAllActive() {
    return await prisma.calendarIntegration.findMany({
      where: {
        isActive: true
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Verificar si un token está próximo a expirar (menos de 1 hora)
   */
  static async findExpiringSoon() {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    
    return await prisma.calendarIntegration.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: oneHourFromNow
        }
      }
    });
  }
}