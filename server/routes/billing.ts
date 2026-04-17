import { Router, Request, Response } from 'express';
import type Stripe from 'stripe';
import { cognitoAuth } from '../middleware/cognitoAuth.js';
import { db } from '../database/connection.js';
import { stripe, STRIPE_PRICE_ID_PRO, STRIPE_WEBHOOK_SECRET, FRONTEND_URL } from '../services/stripeClient.js';

const router = Router();

const stripeUnavailable = (res: Response) =>
  res.status(503).json({ success: false, message: 'Billing is not configured on this server' });

/**
 * POST /api/v1/billing/checkout
 * Pro サブスクリプションの Stripe Checkout セッションを作成し、リダイレクト URL を返す
 */
router.post('/checkout', cognitoAuth, async (req: Request, res: Response) => {
  if (!stripe || !STRIPE_PRICE_ID_PRO) return stripeUnavailable(res);
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const userResult = await db.query<{ email: string; stripe_customer_id: string | null }>(
      'SELECT email, stripe_customer_id FROM users WHERE id = $1',
      [req.userId],
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID_PRO, quantity: 1 }],
      customer: user.stripe_customer_id ?? undefined,
      customer_email: user.stripe_customer_id ? undefined : user.email,
      client_reference_id: req.userId,
      success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/billing/cancel`,
      allow_promotion_codes: true,
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error('[Billing] checkout error:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/v1/billing/portal
 * Stripe Customer Portal セッション作成（既存顧客のサブスクリプション管理）
 */
router.post('/portal', cognitoAuth, async (req: Request, res: Response) => {
  if (!stripe) return stripeUnavailable(res);
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const userResult = await db.query<{ stripe_customer_id: string | null }>(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId],
    );
    const customerId = userResult.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'No active subscription' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/profile`,
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error('[Billing] portal error:', error);
    res.status(500).json({ success: false, message: 'Failed to create portal session' });
  }
});

/**
 * POST /api/v1/billing/webhook
 * Stripe からの subscription イベントを受け、users.plan を自動更新。
 * 署名検証のため raw body が必要（app.ts 側で express.raw を先にマウントする）。
 */
router.post('/webhook', async (req: Request, res: Response) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return stripeUnavailable(res);

  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Billing] Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (userId && customerId) {
          await db.query(
            `UPDATE users SET plan = 'pro', stripe_customer_id = $1, stripe_subscription_id = $2,
                               plan_renewed_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [customerId, subscriptionId ?? null, userId],
          );
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const active = sub.status === 'active' || sub.status === 'trialing';
        await db.query(
          `UPDATE users SET plan = $1, stripe_subscription_id = $2, plan_renewed_at = CURRENT_TIMESTAMP
           WHERE stripe_customer_id = $3`,
          [active ? 'pro' : 'free', sub.id, sub.customer],
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await db.query(
          `UPDATE users SET plan = 'free', stripe_subscription_id = NULL
           WHERE stripe_customer_id = $1`,
          [sub.customer],
        );
        break;
      }
      default:
        // 対象外のイベントは無視
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error('[Billing] Webhook processing error:', error);
    res.status(500).send('Webhook handler failed');
  }
});

export default router;
