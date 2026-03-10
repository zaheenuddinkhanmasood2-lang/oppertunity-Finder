# Opportunity Finder

A Next.js application for finding and analyzing keyword opportunities with SERP (Search Engine Results Page) analysis.

## Features

- **Keyword Management**: Add, edit, and organize keywords by niche
- **SERP Analysis**: Fetch and analyze Google search results for keywords
- **Opportunity Scoring**: Automatic scoring based on weak signals in SERP results
- **Signal Detection**: Identify forum content, outdated results, thin content, and low-authority domains
- **Real-time Updates**: Refresh SERP data with latest search results

## Getting Started

### Prerequisites

1. **Node.js** (version 18 or higher)
2. **Supabase Account**: For database backend
3. **SerpApi Key**: For fetching Google search results

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zaheenuddinkhanmasood2-lang/oppertunity-Finder.git
cd oppertunity-Finder/opportunity-finder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SERPAPI_KEY=your_serpapi_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

The application uses Supabase as the backend. You'll need to create the following tables:

- `niches`: Store niche categories
- `keywords`: Store keywords with analysis data
- `serp_snapshots`: Store SERP results for keywords

## API Endpoints

- `GET /api/keywords/[id]/serp` - Get SERP data for a keyword
- `POST /api/fetch-serp` - Fetch fresh SERP data for a keyword

## Technology Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **External API**: SerpApi for Google search results

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features.
- [SerpApi Documentation](https://serpapi.com/) - learn about SERP data fetching.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
