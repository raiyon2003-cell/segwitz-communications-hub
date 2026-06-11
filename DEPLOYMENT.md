# SegWitz Communications Hub - Deployment Guide

## Prerequisites

- Node.js 20+
- Supabase project (PostgreSQL + Auth + Storage)
- Brevo account with transactional email API key
- Vercel account

## 1. Supabase Setup

### Create Project
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL, anon key, and service role key

### Database
1. Copy connection strings from **Settings > Database**
2. Use the **Transaction pooler** URL for `DATABASE_URL`
3. Use the **Direct connection** URL for `DIRECT_URL`

### Storage Buckets
Create three public buckets in **Storage**:
- `email-templates` - HTML template files
- `attachments` - Email attachments
- `company-assets` - Company logo and assets

Set policies to allow authenticated users read/write.

### Auth
1. Enable Email provider in **Authentication > Providers**
2. Set Site URL to your production domain
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.vercel.app/auth/callback`
   - `https://your-domain.vercel.app/reset-password`

## 2. Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# Push database schema
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed database (divisions, departments, categories, admin user)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with seed admin credentials.

## 3. Apply RLS Policies

After database migration, run `supabase/rls-policies.sql` in the Supabase SQL Editor.

## 4. Vercel Deployment

### Connect Repository
1. Push code to GitHub
2. Import project in Vercel
3. Set framework preset to **Next.js**

### Environment Variables
Add all variables from `.env.example` to Vercel project settings:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooler connection string |
| `DIRECT_URL` | Supabase direct connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ENCRYPTION_KEY` | 32+ char encryption key |
| `SCH_API_KEY` | External API key |
| `NEXT_PUBLIC_APP_URL` | Production URL |

### Deploy
```bash
vercel --prod
```

Or push to main branch for automatic deployment.

## 5. Post-Deployment

1. Run seed script against production database (one time):
   ```bash
   DATABASE_URL=... DIRECT_URL=... npm run db:seed
   ```
2. Login as admin and configure Brevo in **Settings**
3. Create additional users in **Users**
4. Create and approve email templates

## 6. External API (Future Integrations)

Send emails from external SegWitz systems:

```bash
POST /api/v1/send-email
Content-Type: application/json

{
  "apiKey": "your-sch-api-key",
  "templateId": "template-id",
  "to": "client@example.com",
  "variables": {
    "client_name": "John Doe",
    "project_name": "Website Redesign"
  },
  "contactId": "optional-contact-id"
}
```

## 7. Testing Checklist

- [ ] Login / logout works
- [ ] Password reset email received
- [ ] Role permissions enforced per page
- [ ] Template creation (rich text + HTML upload)
- [ ] Template approval workflow
- [ ] Contact CRUD
- [ ] Email compose with variables
- [ ] Email preview matches sent content
- [ ] Brevo email delivery
- [ ] Email history and export
- [ ] Dashboard charts load
- [ ] Communication timeline updates
- [ ] Settings save (Brevo encrypted)
- [ ] File uploads to Supabase Storage

## Troubleshooting

**Prisma connection errors**: Ensure `DATABASE_URL` uses port 6543 (pooler) and `DIRECT_URL` uses port 5432.

**Auth redirect loops**: Verify middleware allows `/auth/callback` and Supabase redirect URLs match.

**Brevo send failures**: Check API key in Settings, verify sender email is verified in Brevo.

**Storage upload errors**: Confirm buckets exist and service role key is set.
