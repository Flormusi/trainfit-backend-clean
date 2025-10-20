import { Request, Response } from 'express';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Inicializar Stripe (necesitarás agregar tu clave secreta en .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Precios de los planes (en centavos)
const PLAN_PRICES = {
  BASIC: 2999, // $29.99
  PREMIUM: 4999, // $49.99
  PROFESSIONAL: 9999, // $99.99
};

interface AuthRequest extends Request {
  user?: any;
}

// @desc    Crear suscripción
// @route   POST /api/payments/create-subscription
// @access  Private
export const createSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { plan, paymentMethodId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    if (!Object.keys(PLAN_PRICES).includes(plan)) {
      return res.status(400).json({ success: false, message: 'Plan inválido' });
    }

    // Verificar si el usuario ya tiene una suscripción
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return res.status(400).json({ 
        success: false, 
        message: 'El usuario ya tiene una suscripción activa' 
      });
    }

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Crear o obtener cliente de Stripe
    let stripeCustomer;
    if (existingSubscription?.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: userId
        }
      });
    }

    // Adjuntar método de pago al cliente
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomer.id,
    });

    // Crear producto y precio en Stripe si no existen
    const product = await stripe.products.create({
      name: `TrainFit ${plan}`,
      description: `Suscripción ${plan} de TrainFit`,
    });

    const price = await stripe.prices.create({
      unit_amount: PLAN_PRICES[plan as keyof typeof PLAN_PRICES],
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      product: product.id,
    });

    // Crear suscripción en Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id as string,
      items: [{ price: price.id }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    // Crear o actualizar suscripción en la base de datos
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeCustomerId: stripeCustomer.id as string,
        stripeSubscriptionId: stripeSubscription.id,
        plan: plan as SubscriptionPlan,
        status: stripeSubscription.status.toUpperCase() as SubscriptionStatus,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      },
      create: {
        userId,
        stripeCustomerId: stripeCustomer.id as string,
        stripeSubscriptionId: stripeSubscription.id,
        plan: plan as SubscriptionPlan,
        status: stripeSubscription.status.toUpperCase() as SubscriptionStatus,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      }
    });

    res.status(201).json({
      success: true,
      data: {
        subscription,
        clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret
      }
    });

  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la suscripción',
      error: error.message
    });
  }
};

// @desc    Obtener suscripción del usuario
// @route   GET /api/payments/subscription
// @access  Private
export const getUserSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    res.status(200).json({
      success: true,
      data: subscription
    });

  } catch (error: any) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la suscripción',
      error: error.message
    });
  }
};

// @desc    Cancelar suscripción
// @route   POST /api/payments/cancel-subscription
// @access  Private
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Suscripción no encontrada' 
      });
    }

    // Cancelar en Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Actualizar en la base de datos
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
        status: 'CANCELLED'
      }
    });

    res.status(200).json({
      success: true,
      data: updatedSubscription,
      message: 'Suscripción cancelada. Tendrás acceso hasta el final del período actual.'
    });

  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la suscripción',
      error: error.message
    });
  }
};

// @desc    Webhook de Stripe
// @route   POST /api/payments/webhook
// @access  Public
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Funciones auxiliares para manejar eventos de webhook
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: (invoice as any).subscription as string }
  });

  if (subscription) {
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        stripePaymentId: (invoice as any).payment_intent as string,
        amount: (invoice.amount_paid || 0) / 100, // Convertir de centavos a dólares
        currency: invoice.currency || 'usd',
        status: 'SUCCEEDED',
        description: invoice.description || 'Pago de suscripción',
        paidAt: new Date((invoice as any).status_transitions?.paid_at ? (invoice as any).status_transitions.paid_at * 1000 : Date.now())
      }
    });

    // Actualizar estado de suscripción
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' }
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: (invoice as any).subscription as string }
  });

  if (subscription) {
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        stripePaymentId: (invoice as any).payment_intent as string,
        amount: (invoice.amount_due || 0) / 100,
        currency: invoice.currency || 'usd',
        status: 'FAILED',
        description: invoice.description || 'Pago de suscripción fallido',
        failureReason: 'Payment failed'
      }
    });

    // Actualizar estado de suscripción
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' }
    });
  }
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      status: stripeSubscription.status.toUpperCase() as SubscriptionStatus,
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end || false
    }
  });
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: { status: 'CANCELLED' }
  });
}

// @desc    Obtener historial de pagos
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'No se encontró suscripción' 
      });
    }

    const payments = await prisma.payment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error: any) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de pagos',
      error: error.message
    });
  }
};