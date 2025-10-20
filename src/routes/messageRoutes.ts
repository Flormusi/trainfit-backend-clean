import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
const prisma = new PrismaClient();

// Obtener conversaciones del usuario
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Obtener todas las conversaciones donde el usuario participa
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clientProfile: {
              select: { name: true }
            },
            trainerProfile: {
              select: { name: true }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clientProfile: {
              select: { name: true }
            },
            trainerProfile: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Agrupar mensajes por conversación
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === userId ? message.receiver : message.sender;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          user: otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      // Contar mensajes no leídos
      if (message.receiverId === userId && !message.isRead) {
        conversationMap.get(otherUserId).unreadCount++;
      }
    });

    const conversationsList = Array.from(conversationMap.values());
    
    res.json(conversationsList);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener mensajes de una conversación específica
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const otherUserId = req.params.userId;
    
    if (!currentUserId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            clientProfile: { select: { name: true } },
            trainerProfile: { select: { name: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Marcar mensajes como leídos
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Enviar un nuevo mensaje
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, content, messageType = 'text', attachments } = req.body;
    
    if (!senderId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receptor y contenido son requeridos' });
    }

    // Verificar que el receptor existe
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ message: 'Usuario receptor no encontrado' });
    }

    // Crear el mensaje
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        messageType,
        attachments
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            clientProfile: { select: { name: true } },
            trainerProfile: { select: { name: true } }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Marcar mensaje como leído
router.patch('/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const messageId = req.params.messageId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const message = await prisma.message.update({
      where: {
        id: messageId,
        receiverId: userId
      },
      data: {
        isRead: true
      }
    });

    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener conteo de mensajes no leídos
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;