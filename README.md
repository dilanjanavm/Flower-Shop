# Sithuliya Flora — Storefront

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4. It runs on mock data. See `../README.md` for the full picture.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Pages (SRS UI-03)

| Route | Purpose |
|---|---|
| `/` | Home: hero photo strip, occasions, best sellers, custom-bouquet promo, reviews, reminders |
| `/shop` | Filters for occasion, flower, style, colour and price (AND across groups, OR within a group), held in the URL. Includes sort, search and pagination |
| `/product/[slug]` | Size tier, wrap, ribbon, add-ons, card message (250 characters) or anonymous, earliest delivery date, reviews and JSON-LD |
| `/custom-bouquet` | Four-step quotation request: flowers, then style and wrap, then delivery, then review |
| `/cart`, `/checkout` | Delivery or pickup, a 60-day calendar, slots with capacity, address book, zone fee, coupon and loyalty points |
| `/order/[orderNumber]` | Bank details, copy buttons, payment countdown, slip upload (drag and drop, JPG/PNG/PDF up to 5 MB) and the tracker |
| `/track`, `/track/[token]` | Public, anonymised tracking |
| `/account/*` | Overview, orders (invoice, reorder, review), quotations (accept or decline), addresses, reminders, profile |
| `/login`, `/register`, `/forgot-password` | Password, SMS OTP and Google (mock) |
| `/about`, `/delivery`, `/contact`, `/terms`, `/privacy` | Static pages |

## Where things live

- `src/lib/mock/*`: catalogue, delivery zones and slots, settings, seed account data
- `src/lib/store.tsx`: client mock store (cart, auth, orders, quotations…). Swap the action bodies for API calls.
- `src/lib/dates.ts`: Colombo-time date helpers and the lead-time rule
- `src/components/*`: UI kit (`ui/`), layout, home sections, product, checkout, account

**Demo-only buttons** let you play the shop's part without the admin panel: "Demo: owner replies" on a quotation, "Demo: approve slip" on an order, and "Advance status". Remove them when the API is connected.
