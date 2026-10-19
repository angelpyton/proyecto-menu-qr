<div align="center">
  <img src="assets/images/Screenshot.png" alt="Rannaghor Banner" width="100%">
  
  <h1>Rannaghor</h1>
  <p><strong>A Next-Generation Restaurant Ordering & Management System</strong></p>

  <p>
    <a href="https://tamimtxd.github.io/restaurant-ordering-system/" target="_blank" rel="noopener noreferrer"><strong>Explore the Live Demo »</strong></a>
  </p>
</div>

***

## 📖 Overview

**Rannaghor** is a modern, high-performance web application designed to bridge the gap between dining customers and restaurant kitchens. Built entirely with vanilla web technologies and powered by Supabase for real-time synchronization, it delivers an app-like experience without requiring any downloads.

The system features a **luxury dark-mode Glassmorphic UI**, order tracking, and dashboards for staff.

## Estado para implementación

Esta copia no se conecta a una base Supabase hasta que completes las credenciales en `js/app-config.js`. Sin conexión o sin platos cargados, muestra un menú de demostración de solo lectura para revisar la interfaz; no permite enviar comandas.

Para operar con pedidos reales, configura Supabase, ejecuta `supabase/production.sql` y crea usuarios de personal con `app_metadata.role = 'staff'`. El menú y operaciones tienen que apuntar al mismo proyecto para validar los precios. No ejecutes los SQL de desarrollo en producción.

## ✨ Key Features

### 🎨 Elite User Interface & Experience
- **Cinematic Dark Mode & Glassmorphism:** A breathtaking modern aesthetic featuring frosted glass panels, deep mesh gradients, and tactile micro-animations.
- **Fluid Responsiveness:** Built without relying heavily on media queries, utilizing advanced CSS `clamp()` functions to ensure typography and geometry scale flawlessly across mobile, tablet, and desktop displays.
- **Dynamic Interactions:** Features sophisticated hover states, interactive light-shine effects on primary actions, and smooth physical push-scaling for intuitive feedback.

### 🍽️ Customer Ordering System
- **QR Code Table Detection:** Customers scan a QR code at their table to instantly launch the app assigned to their specific dining session.
- **Interactive Menu:** A categorized, highly visual menu with a full-bleed hero slider for "Today's Specials".
- **Real-Time Cart & Checkout:** Add items, modify quantities, and confirm the order total with 10% IVA already included in each menu price. The IVA amount is shown for reference and is not added again.
- **Live Order Tracking:** Customers watch their order status change in real-time as the kitchen prepares it (Received → Preparing → Ready).
- **Post-Meal Rating System:** Once an order is served, an elegant modal automatically prompts customers to rate their individual dishes and provide feedback.

### 👨‍🍳 Kitchen Staff Dashboard
- **Instant Synchronization:** Connected to the Supabase Realtime API, new orders appear instantly on the dashboard with a notification chime.
- **Order Lifecycle Management:** Kitchen staff can smoothly transition orders through preparation stages.
- **Staff dashboards:** Cocina y administración requieren una sesión Supabase con rol de personal.

## 🛠️ Technology Stack

Rannaghor is built to be fast, lightweight, and deployable anywhere. 

*   **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+). No heavy frameworks.
*   **Design System:** Custom CSS tokens, advanced Flexbox/Grid layouts, CSS transitions, and keyframe animations.
*   **Icons:** <a href="https://lucide.dev/" target="_blank" rel="noopener noreferrer">Lucide Icons</a> (Lightweight SVG integration).
*   **Backend / Database:** <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer">Supabase</a>. Handles PostgreSQL storage and WebSocket real-time event subscriptions.

## 📂 Architecture & Project Structure

```text
rannaghor/
├── index.html              # The main customer-facing application
├── management/
│   ├── index.html          # Product and QR table management
│   └── kitchen.html        # Real-time kitchen dashboard
├── css/
│   ├── style.css           # Global design system, animations, and main UI
│   └── kitchen.css         # Specialized stylesheet for the dashboard grids
├── js/
│   ├── app-config.js        # Restaurant Supabase public configuration
│   ├── script.js           # Core state management, DOM logic, and cart math
│   ├── kitchen.js          # Staff dashboard logic and order state mutations
│   └── supabase-config.js  # Database initialization and realtime listeners
└── assets/                 # High-resolution food photography and media
```

## 🚀 Quick Setup Guide

Want to run Rannaghor locally or fork the project for your own restaurant? 

### 1. Clone the Repository
```bash
git clone https://github.com/tamimtxd/restaurant-ordering-system.git
cd restaurant-ordering-system
```

### 2. Supabase Configuration
Create one Supabase project and set the same project URL and public anon/publishable key under both `menu` and `operations` in [`js/app-config.js`](js/app-config.js). These public keys are visible to browsers by design; **never put a `service_role` or secret key there**.

Create the tables with the columns used by the app:

- Menu project: `platos` (`id`, `nombre`, `precio`, `categoria`, `imagen_url`) and `ratings` (`order_number`, `table_number`, `item_id`, `item_name`, `stars`, `feedback`, `created_at`).
- Operations project: `pedidos` (`id`, `mesa`, `detalles` JSONB, `total`, `estado`, `creado_en`) and `waiter_calls` (`id`, `table_number`, `status`, `created_at`). Add both operations tables to Supabase Realtime publication.

For production, run only [`supabase/production.sql`](supabase/production.sql) in the Supabase SQL editor. It creates the tables and guarded policies, validates order lines and calculates totals from the database menu, and enables Realtime for staff dashboards. Create staff users in Supabase Auth, then assign `app_metadata.role` to `staff` from a trusted admin process; one option in the SQL editor is `UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"staff"}'::jsonb WHERE email = 'correo-del-personal';` (replace the email). Do not use editable `user_metadata` for authorization. The login screens reject accounts without that role. The script drops existing policies on these four tables, so review any custom policies before applying it to a database that already contains unrelated application data.

After setup, sign in at `/management/` and add the restaurant menu. Use QR links on the final HTTPS domain and test a complete order and each kitchen status. The current code does not provide payment processing, inventory control, or receipt/fiscal integration. Orders and customer history are stored locally in the customer's browser; order status polling requires that browser to retain its tracking token.

The scripts [`supabase/menu.sql`](supabase/menu.sql) and [`supabase/operations.sql`](supabase/operations.sql) are for local development only. Their open policies let visitors change data. Never use them for live restaurant data.

Order statuses are `Pendiente`, `En preparación`, `Listo`, and `Entregado`; the customer sees status changes from the kitchen dashboard. Menu prices and the stored order total are treated as IVA-inclusive at 10%. The displayed IVA portion is calculated as `total × 10 / 110` and rounded to the nearest guaraní; it is informational and does not change the total sent to Supabase. Carts and customer order history are browser-local, so they do not follow a diner across devices.

### 3. Launch
No build step is required. Serve the repository over HTTPS. Opening `/` displays the role selector; a QR URL such as `/?table=1` opens the customer flow directly. Staff dashboards are at `/management/` and `/management/kitchen.html`. Generate and test QR codes from the final HTTPS domain after configuring Supabase and replacing the development RLS policies.

## 🔮 Roadmap & Future Expansion

This project is actively maintained. Upcoming milestones include:

- [x] **Product Admin Panel:** Interface for restaurant managers to add and edit menu items (backend authorization must be configured separately).
- [ ] **Digital Checkout Flow:** Secure integration with payment gateways (e.g., Stripe) to allow customers to pay digitally.
- [ ] **Advanced Analytics:** A dashboard for restaurant owners to track peak hours and revenue metrics.
- [ ] **User Accounts:** Persistent profiles and order histories using Supabase Auth.
- [ ] **Rewards System:** A simple loyalty program to reward frequent diners.

## 📄 License & Credits

This project is open-sourced under the **MIT License**. You are free to copy, modify, and distribute the work for both personal and commercial use. 

*Designed and Developed passionately in Bangladesh.* 🇧🇩
