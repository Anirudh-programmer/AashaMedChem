# Aasa MedChem - Inventory & Order Management

An inventory and quotation management system built with Next.js, Neon PostgreSQL (using Prisma), and Clerk for role-based permissions.

---

## 1. Project Overview & Features

### Features:
- **Authentication**: Secure registration and login flows.
- **Role-Based Access**: Restricted views for Admin and Seller portals.
- **Product Management**: Create, update, and delete chemical products.
- **Inventory Tracking**: Monitor available stock vs. peak capacity and trace changes.
- **Unit Conversion**: Automatic, stoichiometry-grade calculations across multiple units.
- **Order/Quotation System**: Sellers submit quotation drafts, which deduct stock upon Admin approval.
- **Admin Dashboard**: Audit stock levels, adjust inventory with comments, and dispatch approved orders.

---

## 2. Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Vanilla CSS (Glassmorphism layout)
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: Neon PostgreSQL (Serverless relational database)
- **ORM**: Prisma Client
- **Authentication**: Clerk

---

## 3. High-Level System Design

### Design Flow:
```
User (Browser)
   ↓
Next.js Frontend (React Server & Client Components)
   ↓
Next.js API Routes (Backend Route Handlers with Auth Checks)
   ↓
Prisma Client
   ↓
Neon PostgreSQL (Primary Database)
```

### Component Interaction:
1. **Frontend**: Client components render the interactive dashboard views. Client-side state manages search filters and converts units dynamically for instant price estimates.
2. **Backend**: Route handlers validate authorization headers via Clerk, calculate stoichiometry-grade conversion factors, and execute Prisma database transaction statements.
3. **Database**: Stores products, transaction logs, and quotation details using precise column types to avoid floating point errors.

---

## 4. Database Schema

### Key Tables & Field Specifications:

#### Product (Product metadata and stock levels)
- `id` (String / CUID) - Primary Key
- `name` (String) - Product name
- `sku` (String) - Unique SKU code
- `category` (String) - Product category
- `description` (String) - Product description
- `baseUnit` (String) - Internal base unit (`g`, `mL`, `unit`)
- `basePrice` (Decimal / NUMERIC(20,6)) - Base price in INR per base unit
- `stock` (Decimal / NUMERIC(20,6)) - Available stock in base units
- `lowStockThreshold` (Decimal / NUMERIC(20,6)) - Warn alert threshold
- `status` (String) - Status state (`active` | `inactive`)

#### InventoryHistory (Audit logs of stock updates)
- `id` (String / CUID) - Primary Key
- `productId` (String) - Foreign Key to Product
- `changeQty` (Decimal / NUMERIC(20,6)) - Adjustment quantity delta
- `newQty` (Decimal / NUMERIC(20,6)) - Resulting stock quantity
- `note` (String) - Log reason or order approval ID

#### Quotation (Order header info)
- `id` (String / CUID) - Primary Key
- `sellerName` (String) - Submitting seller's name
- `sellerEmail` (String) - Submitting seller's email
- `status` (String) - Order status (`pending` | `approved` | `rejected` | `fulfilled`)
- `total` (Decimal / NUMERIC(20,6)) - Total quotation value in INR

#### QuotationItem (Order line items)
- `id` (String / CUID) - Primary Key
- `quotationId` (String) - Foreign Key to Quotation
- `productId` (String) - Foreign Key to Product (nullable for audit safety)
- `orderedQty` (Decimal / NUMERIC(20,6)) - Raw quantity ordered in `orderedUnit`
- `orderedUnit` (String) - Selection unit (`kg`, `g`, `L`, `mL`, `unit`)
- `baseQty` (Decimal / NUMERIC(20,6)) - Converted quantity in base units
- `lineTotal` (Decimal / NUMERIC(20,6)) - Line cost in INR (`baseQty * basePrice`)

---

## 5. Unit Storage & Conversion Strategy

### Dimensional Base Units:
All quantities are normalized and stored internally in the smallest base units for complete mathematical consistency:
- **Weight**: Base Unit = grams (`g`)
- **Volume**: Base Unit = milliliters (`mL`)
- **Count**: Base Unit = items (`unit`)

### Conversion Factors:
Conversions are applied relative to the base unit using strict multipliers:
- `1 kg = 1000 g`
- `1 L = 1000 mL`
- `1 unit = 1 unit`

---

## 6. Price & Quantity Storage

### Precision Strategy:
- **Data Type**: `NUMERIC(20,6)` (mapped via Prisma as `Decimal(20,6)`).
- **Rationale**: Standard floating-point types (`float`, `double`) introduce binary rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). Using arbitrary-precision `NUMERIC` types guarantees arithmetic accuracy for scientific chemical quantities and financial calculations.
- **Rounding Rules**: Line totals are calculated at 6 decimal places of precision during stock transactions and are rounded to 2 decimal places in the UI for display formatting.

---

## 7. Edge Cases & Transactional Safety

To ensure data integrity and prevent inventory errors, the following protections are active:
- **Insufficient Stock Validation**: When an Admin attempts to approve a quotation, the backend verifies that `Product.stock >= baseQty`. If available stock is insufficient (e.g. available is `3 kg` but seller ordered `4 kg`), the action is rejected, and an error is returned: `Insufficient stock for [Product Name]`.
- **Atomic Transactions (Rollbacks)**: All inventory changes are wrapped in a database transaction (`prisma.$transaction`). If a quote contains multiple items and even one item fails the stock validation, the entire transaction is rolled back, preventing partial stock deductions.
- **Manual Stock Refill Tracking**: Manual inventory adjustments are immediately logged in the `InventoryHistory` table to keep the historical audit trail complete.

---

## 8. Setup Instructions

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Setup your local environment file
cp .env.example .env

# Run development server
npm run dev
```

---

## 9. Neon Database Setup

1. Create a project on the [Neon Console](https://neon.tech).
2. Copy the connection string for your database.
3. Add the `DATABASE_URL` variable in your `.env` file.
4. Run migrations to initialize the database tables:
   ```bash
   npx prisma db push
   npm run db:generate
   ```
5. Seed initial products:
   ```bash
   node prisma/seed.js
   ```

---

## 10. Vercel Deployment

1. Push your code changes to GitHub.
2. Import the project in Vercel.
3. Configure the environment variables in your Vercel Project Settings:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Click **Deploy**.

---

## 11. Login Credentials & Access Control

The application uses Clerk authentication. Any signed-up user can instantly switch roles without needing pre-configured test credentials.
* **Role Switcher**: Click the **Switch to Admin / Seller** button in the topbar of the dashboard.
* The system will update your Clerk metadata dynamically and redirect you to the corresponding portal:
  - **Admin Path**: `/admin/products`
  - **Seller Path**: `/seller/browse`

---

## 12. How To Use The Application

### Admin User Flow:
1. **Manage Products**: Go to **Products** to add, edit, or delete items. Specify SKU, base price, and base unit (`g`, `mL`, or `unit`).
2. **Audit Stock**: Go to **Inventory** to view stock progress bars. The percentage shows available stock relative to the peak recorded stock.
3. **Manual Adjustments**: Click **Adjust** next to any item to add/deduct stock with an audit trail note.
4. **Approve & Dispatch**: Go to **Orders** to view pending quotes. Approve a quote to deduct inventory automatically. Once ready, click **Confirm Dispatch** to fulfill the order.

### Seller User Flow:
1. **Browse Catalog**: Go to **Browse Catalog** to search chemicals. Rate cards display price estimates dynamically adjusted for the select unit dropdown.
2. **Draft Quotation**: Go to **New Quotation** and add chemicals to your draft.
3. **Select Units**: Enter quantities and choose desired units (e.g. order `2 kg` of Activated Charcoal). Check that calculations are correct.
4. **Submit Order**: Submit the quote and track its status under **My Orders**.
