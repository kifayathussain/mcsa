# Multi-Channel Sales App (MCSA)

A comprehensive e-commerce management platform that centralizes operations across multiple sales channels including Amazon, eBay, Etsy, Shopify, and Walmart.

## 🚀 Features

### ✅ Completed Core Features
- **Dashboard Overview** - Key metrics and analytics
- **Product Management** - Add, edit, delete products with inventory tracking
- **Order Management** - Order processing and status updates
- **Inventory Management** - Stock level tracking and low stock alerts
- **Amazon Integration** - SP-API client for order and inventory sync
- **Authentication** - Supabase-powered user authentication
- **Responsive UI** - Modern design with dark/light mode support

### 🚧 Roadmap Features
- **Multi-Channel Integrations** - eBay, Etsy, Shopify, Walmart
- **Advanced Analytics** - Sales trends, forecasting, performance metrics
- **Customer Management** - CRM with customer insights
- **Shipping & Fulfillment** - Carrier integrations and automation
- **Returns & Refunds** - Complete returns management system
- **Pricing & Promotions** - Dynamic pricing and discount management

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 📋 Prerequisites

- Node.js 18+ 
- Yarn package manager
- Supabase account
- Amazon SP-API credentials (for Amazon integration)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/kifayathussain/mcsa.git
cd mcsa
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Amazon SP-API Configuration
AMAZON_CLIENT_ID=your_amazon_client_id
AMAZON_CLIENT_SECRET=your_amazon_client_secret
AMAZON_REFRESH_TOKEN=your_amazon_refresh_token
AMAZON_SELLER_ID=your_amazon_seller_id
AMAZON_MARKETPLACE_ID=your_amazon_marketplace_id

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### 4. Database Setup
Run the SQL scripts in the `scripts/` directory to set up your Supabase database:

```bash
# Execute these in your Supabase SQL editor:
# 1. scripts/001_create_tables.sql
# 2. scripts/002_create_functions.sql  
# 3. scripts/003_insert_mock_data.sql
```

### 5. Start Development Server
```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
mcsa/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── channels/          # Channel integration components
│   ├── dashboard/         # Dashboard components
│   ├── inventory/         # Inventory management
│   ├── orders/            # Order management
│   ├── products/          # Product management
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── amazon/            # Amazon SP-API client
│   └── supabase/          # Supabase client configuration
├── scripts/               # Database setup scripts
├── styles/                # Additional styles
└── public/                # Static assets
```

## 🔧 Development

### Available Scripts
```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## 🗄 Database Schema

The application uses the following main tables:
- `users` - User authentication and profiles
- `products` - Product catalog
- `orders` - Order management
- `inventory` - Stock levels and tracking
- `channels` - Connected sales channels
- `channel_products` - Product-channel mappings

## 🔌 API Integrations

### Amazon SP-API
- Order synchronization
- Inventory management
- Product listing
- Real-time updates

### Supabase
- User authentication
- Database operations
- Real-time subscriptions
- File storage

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
yarn build
yarn start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: kifoo136@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/kifayathussain/mcsa/issues)
- 📖 Documentation: [Project Wiki](https://github.com/kifayathussain/mcsa/wiki)

## 🗺 Roadmap

See [TODO.md](TODO.md) for the complete development roadmap with 20 phases covering:
- Enhanced channel integrations
- Advanced analytics and reporting
- Customer management (CRM)
- Shipping and fulfillment
- Returns and refunds
- And much more!

---

**Built with ❤️ by [kifayathussain](https://github.com/kifayathussain)**
