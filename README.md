# E-Commerce Store with React, TypeScript and Supabase

A modern e-commerce store built with React, TypeScript, and Supabase for the backend. This portfolio project demonstrates best practices for building scalable e-commerce applications.

## Features

- 🔐 User authentication with Supabase Auth
- 🛒 Shopping cart functionality (persisted for both guests and logged-in users)
- 🛍️ Product catalog with categories, filtering, and search
- ⭐ Product reviews and ratings
- 💳 Checkout process
- 👤 User profiles and order history
- 📱 Responsive design for all device sizes
- 🔑 Admin dashboard for product and order management

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend/API**: Supabase (PostgreSQL, Node.js)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Routing**: React Router
- **Styling**: TailwindCSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/react-ts-supabase-ecommerce.git
   cd react-ts-supabase-ecommerce
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) to view the app in your browser.

## Supabase Setup

1. Create a new Supabase project
2. Set up the following tables:
   - users
   - products
   - product_variations
   - orders
   - order_items
   - cart_items
   - reviews
   - shipping_addresses

Detailed SQL schema creation scripts are available in the `database` folder.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── admin/        # Admin-specific components
│   ├── common/       # Shared components
│   └── customer/     # Customer-facing components
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── pages/            # Page components
│   ├── admin/        # Admin pages
│   └── customer/     # Customer pages
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
