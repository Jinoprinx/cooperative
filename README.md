# Cooperative Society Management System - Frontend

This is the frontend application for the Cooperative Society Management System built with Next.js, TypeScript, Tailwind CSS, and DaisyUI.

## Features

- User authentication (login/signup)
- Member dashboard
- Transaction management
- Loan application and tracking
- Bank account connection for automatic deductions
- Admin portal with comprehensive management tools
- Reporting and analytics

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS with DaisyUI
- **State Management**: React Query
- **Forms**: React Hook Form with Zod validation
- **Authentication**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cooperative-society-app
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js app directory
  - `components/` - Reusable UI components
  - `auth/` - Authentication pages (login, register)
  - `dashboard/` - Member dashboard pages
  - `admin/` - Admin portal pages
  - `api/` - API routes
- `lib/` - Utility functions and services
- `public/` - Static assets

## Development

### Building for Production

```bash
npm run build
# or
yarn build
```

### Starting Production Server

```bash
npm start
# or
yarn start
```

## Connecting to Backend

This frontend application is designed to work with the cooperative-society-backend API. Make sure the backend server is running before using the frontend application.

## License

This project is licensed under the MIT License - see the LICENSE file for details.