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

The system features a **luxury dark-mode Glassmorphic UI**, seamless order tracking, and a dedicated synchronization dashboard that allows staff to manage tables and orders in real-time.

## ✨ Key Features

### 🎨 Elite User Interface & Experience
- **Cinematic Dark Mode & Glassmorphism:** A breathtaking modern aesthetic featuring frosted glass panels, deep mesh gradients, and tactile micro-animations.
- **Fluid Responsiveness:** Built without relying heavily on media queries, utilizing advanced CSS `clamp()` functions to ensure typography and geometry scale flawlessly across mobile, tablet, and desktop displays.
- **Dynamic Interactions:** Features sophisticated hover states, interactive light-shine effects on primary actions, and smooth physical push-scaling for intuitive feedback.

### 🍽️ Customer Ordering System
- **QR Code Table Detection:** Customers scan a QR code at their table to instantly launch the app assigned to their specific dining session.
- **Interactive Menu:** A categorized, highly visual menu with a full-bleed hero slider for "Today's Specials".
- **Real-Time Cart & Checkout:** Add items, modify quantities, and confirm the order total without tax. No refreshing required.
- **Live Order Tracking:** Customers watch their order status change in real-time as the kitchen prepares it (Received → Preparing → Ready).
- **Post-Meal Rating System:** Once an order is served, an elegant modal automatically prompts customers to rate their individual dishes and provide feedback.

### 👨‍🍳 Kitchen Staff Dashboard
- **Instant Synchronization:** Connected to the Supabase Realtime API, new orders appear instantly on the dashboard with a notification chime.
- **Order Lifecycle Management:** Kitchen staff can smoothly transition orders through preparation stages.
- **Staff dashboards:** Kitchen and product management screens are available without sign-in, as configured for this restaurant. Their access is enforced only by the database policies.

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
The customer menu and ratings are stored in one Supabase project; orders and waiter calls are stored in a second project. Customer cart and order tracking data are cached in that customer's browser.
1. Create a free account at <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer">Supabase</a>.
2. Configure the menu project with `platos` (`id`, `nombre`, `precio`, `categoria`, `imagen_url`) and `ratings` (`order_number`, `table_number`, `item_id`, `item_name`, `stars`, `feedback`, `created_at`). Configure the operations project with `pedidos` (`id`, `mesa`, `detalles`, `total`, `estado`, `creado_en`) and `waiter_calls` (`id`, `table_number`, `status`, `created_at`). The application stores order items and special instructions in `detalles` JSONB.
3. Obtain the project URL and public anon/publishable key. Never put a `service_role` or secret key in browser code.
4. Set the menu project credentials in `js/script.js` and `management/index.html`; set the operations project credentials in `js/supabase-config.js`.
5. Realtime and open read/write RLS policies are configured for this deployment. `pedidos` and `waiter_calls` must both be in the operations project's Realtime publication. The public policies allow anyone with the public key to view or modify these records; staff authentication is intentionally deferred.

The app uses separate Supabase projects for the customer menu and order/kitchen flow. The order status values are `Pendiente`, `En preparación`, `Listo`, and `Entregado`; tax is not added. Keep the two projects' URLs and public keys aligned with the existing configuration files.

### 3. Launch
Because it uses vanilla web architecture, you do not need Node.js or a build step.
Serve the repository over HTTPS (for example, with a static web host). Open a QR URL such as `/?table=1` to use the customer flow. Opening `/` displays QR scanning instructions. Staff dashboards are at `/management/` and `/management/kitchen.html`.

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
