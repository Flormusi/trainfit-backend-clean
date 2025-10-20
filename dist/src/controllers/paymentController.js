"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientPayment = exports.getClientPaymentStatus = exports.handlePaymentWebhook = exports.createPaymentPreference = void 0;
const mercadopago_1 = require("mercadopago");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Configurar Mercado Pago
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: {
        timeout: 5000,
        idempotencyKey: 'abc'
    }
});
const preference = new mercadopago_1.Preference(client);
// Crear preferencia de pago
const createPaymentPreference = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const { clientId, amount, description, planType } = req.body;
        // Verificar que el entrenador tiene acceso al cliente
        const trainerClientRelation = await prisma.trainerClient.findFirst({
            where: {
                trainerId: user.id,
                clientId: clientId
            },
            include: {
                client: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        if (!trainerClientRelation) {
            res.status(403).json({ message: 'No tienes acceso a este cliente' });
            return;
        }
        // Crear la preferencia de pago
        const preferenceData = {
            items: [
                {
                    id: `plan-${planType}-${clientId}`,
                    title: description || `Plan de entrenamiento - ${trainerClientRelation.client.name}`,
                    quantity: 1,
                    unit_price: parseFloat(amount),
                    currency_id: 'ARS'
                }
            ],
            payer: {
                name: trainerClientRelation.client.name,
                email: trainerClientRelation.client.email
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/trainer/clients/${clientId}?payment=success`,
                failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/trainer/clients/${clientId}?payment=failure`,
                pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/trainer/clients/${clientId}?payment=pending`
            },
            auto_return: 'approved',
            external_reference: `${user.id}-${clientId}-${Date.now()}`,
            notification_url: `${process.env.BACKEND_URL || 'http://localhost:5002'}/api/payments/webhook`,
            metadata: {
                trainerId: user.id,
                clientId: clientId,
                planType: planType
            }
        };
        const result = await preference.create({ body: preferenceData });
        // Guardar la preferencia en la base de datos
        await prisma.paymentPreference.create({
            data: {
                preferenceId: result.id,
                trainerId: user.id,
                clientId: clientId,
                amount: parseFloat(amount),
                description: description || `Plan de entrenamiento - ${trainerClientRelation.client.name}`,
                planType: planType,
                status: 'pending',
                externalReference: `${user.id}-${clientId}-${Date.now()}`
            }
        });
        res.status(200).json({
            success: true,
            preferenceId: result.id,
            initPoint: result.init_point,
            sandboxInitPoint: result.sandbox_init_point
        });
    }
    catch (error) {
        console.error('Error creating payment preference:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la preferencia de pago',
            error: error.message
        });
    }
};
exports.createPaymentPreference = createPaymentPreference;
// Webhook para recibir notificaciones de Mercado Pago
const handlePaymentWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        if (type === 'payment') {
            const paymentId = data.id;
            // Aquí podrías consultar el estado del pago usando la API de Mercado Pago
            // y actualizar el estado en tu base de datos
            console.log('Payment notification received:', paymentId);
            // Actualizar el estado del pago en la base de datos
            // Esta lógica se puede expandir según las necesidades
            res.status(200).json({ success: true });
        }
        else {
            res.status(200).json({ success: true, message: 'Notification type not handled' });
        }
    }
    catch (error) {
        console.error('Error handling payment webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar webhook',
            error: error.message
        });
    }
};
exports.handlePaymentWebhook = handlePaymentWebhook;
// Obtener estado de pago del cliente
const getClientPaymentStatus = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const { clientId } = req.params;
        // Verificar que el entrenador tiene acceso al cliente
        const trainerClientRelation = await prisma.trainerClient.findFirst({
            where: {
                trainerId: user.id,
                clientId: clientId
            }
        });
        if (!trainerClientRelation) {
            res.status(403).json({ message: 'No tienes acceso a este cliente' });
            return;
        }
        // Buscar el último pago del cliente
        const lastPayment = await prisma.paymentPreference.findFirst({
            where: {
                trainerId: user.id,
                clientId: clientId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        if (!lastPayment) {
            res.status(200).json({
                success: true,
                data: {
                    status: 'pending',
                    amount: 0,
                    dueDate: new Date().toISOString().split('T')[0],
                    plan: 'Sin plan asignado'
                }
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                status: lastPayment.status,
                amount: lastPayment.amount,
                dueDate: lastPayment.createdAt.toISOString().split('T')[0],
                lastPayment: lastPayment.updatedAt.toISOString().split('T')[0],
                plan: lastPayment.planType || 'Plan Básico'
            }
        });
    }
    catch (error) {
        console.error('Error getting client payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado de pago',
            error: error.message
        });
    }
};
exports.getClientPaymentStatus = getClientPaymentStatus;
// Actualizar información de pago del cliente
const updateClientPayment = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const { clientId } = req.params;
        const { amount, dueDate, planType, status } = req.body;
        // Verificar que el entrenador tiene acceso al cliente
        const trainerClientRelation = await prisma.trainerClient.findFirst({
            where: {
                trainerId: user.id,
                clientId: clientId
            }
        });
        if (!trainerClientRelation) {
            res.status(403).json({ message: 'No tienes acceso a este cliente' });
            return;
        }
        // Crear o actualizar información de pago
        const paymentData = {
            trainerId: user.id,
            clientId: clientId,
            amount: parseFloat(amount),
            planType: planType,
            status: status || 'pending',
            description: `Plan ${planType} - Cliente ${clientId}`,
            externalReference: `manual-${user.id}-${clientId}-${Date.now()}`
        };
        const updatedPayment = await prisma.paymentPreference.create({
            data: paymentData
        });
        res.status(200).json({
            success: true,
            data: updatedPayment
        });
    }
    catch (error) {
        console.error('Error updating client payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar información de pago',
            error: error.message
        });
    }
};
exports.updateClientPayment = updateClientPayment;
