# BrandMyFlight

BrandMyFlight is a fixed-inventory sponsorship campaign for a founder flight from Lahore to New York. Startups can reserve one of ten positions on a fictional Sponsor Pass, preview their public brand metadata automatically, and pay through Stripe Checkout without creating an account.

## Product flow

1. Choose a Sponsor Pass position priced from $20–$250.
2. Enter a startup URL and optional X handle.
3. The server safely fetches the public favicon, title, and tagline.
4. Stripe Checkout collects the receipt email and card payment.
5. A signed Stripe webhook marks the Supabase reservation as paid.

BrandMyFlight never stores receipt emails or card details in Supabase. The database contains only public sponsor information, position state, and Stripe transaction identifiers.

The Sponsor Pass is promotional artwork, not a travel document. It contains no barcode, QR code, booking reference, or real airline branding.

## Local setup

This project requires Node.js 22 or later.

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Fill in `.env.local` with a Supabase project service-role key and Stripe test credentials. Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.

Apply all database migrations in:

```text
supabase/migrations
```

For local Stripe fulfillment, forward signed events to:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret printed by Stripe into `STRIPE_WEBHOOK_SECRET`.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

The metadata preview endpoint blocks local/private networks, non-standard ports, oversized HTML responses, and unsafe redirect targets.
