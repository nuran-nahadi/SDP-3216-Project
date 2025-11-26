# LIN - Life Manager Frontend

A modern, performant, and accessible frontend application built with Next.js 14+, TypeScript, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5+ (Strict Mode)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS v4 with custom violet theme (OKLCH colors)
- **State Management**: React Context + Custom Hooks
- **Data Fetching**: Axios with interceptors
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running at http://127.0.0.1:8000

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration.

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
next-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (app)/             # Protected app pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   ├── features/          # Feature-specific components
│   │   └── shared/            # Shared components
│   └── lib/
│       ├── api/               # API client and services
│       ├── hooks/             # Custom React hooks
│       ├── context/           # React Context providers
│       ├── utils/             # Utility functions
│       └── types/             # TypeScript type definitions
├── public/                     # Static assets
├── .env.local                 # Environment variables (not in git)
├── .env.example               # Environment variables template
├── components.json            # shadcn/ui configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## Design System

### Color Theme

The application uses a custom violet theme with OKLCH color space for better color perception:

- **Primary**: Violet shades for main actions and highlights
- **Secondary**: Muted violet for secondary elements
- **Accent**: Light violet for hover states
- **Destructive**: Red for destructive actions

### Typography

- **Font**: Inter (system font fallback)
- **Sizes**: Responsive typography using Tailwind's text utilities

### Components

All UI components are built with shadcn/ui, providing:

- Full accessibility (WCAG 2.1 AA)
- Keyboard navigation
- Screen reader support
- Customizable with Tailwind CSS

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier rules
- Use functional components with hooks
- Implement proper error boundaries
- Add loading states for async operations

### Component Guidelines

- Keep components small and focused
- Use composition over inheritance
- Implement proper TypeScript types
- Add JSDoc comments for complex logic
- Use the `cn()` utility for className merging

### State Management

- Use React Context for global state (auth, theme)
- Use custom hooks for data fetching
- Implement Observer pattern for cross-component communication
- Keep component state local when possible

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://127.0.0.1:8000)
- `NEXT_PUBLIC_APP_NAME` - Application name (default: LIN)
- `NEXT_PUBLIC_ENABLE_ANALYTICS` - Enable analytics (default: false)

## Building for Production

1. Build the application:

```bash
npm run build
```

2. Test the production build locally:

```bash
npm run start
```

3. Deploy to your hosting platform (Vercel, Netlify, etc.)

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## License

Private - All rights reserved
