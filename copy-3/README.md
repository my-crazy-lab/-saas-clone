# SaaS Analytics Dashboard

A comprehensive analytics dashboard for SaaS businesses to track key metrics like MRR, churn rate, LTV, and more through payment gateway integrations.

## Features

- **Payment Gateway Integration**: Connect with Stripe and PayPal via OAuth
- **Key Metrics**: MRR, Churn Rate, LTV, Active Users, Revenue Reports
- **Interactive Dashboard**: Real-time charts and visualizations
- **Export Capabilities**: PDF and CSV export functionality
- **User Management**: Role-based access control (Admin/Viewer)
- **Real-time Updates**: Webhook support for live data updates

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **State Management**: Zustand
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT
- **Payment APIs**: Stripe SDK, PayPal SDK

## Project Structure

```
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── docs/             # Documentation
├── docker-compose.yml # Development environment
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd saas-analytics-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

4. Start development servers
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:8000`.

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/saas_analytics
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev
```

## API Documentation

API documentation is available at `http://localhost:8000/docs` when running the development server.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
