# FashionFusion

FashionFusion is an AI-assisted fashion platform with three connected workflows:

- generate fashion designs from prompts, reference images, or sketches
- preview garments with virtual try-on
- send a design to tailors, collect competing quotes, and convert the accepted quote into a confirmed order

The project uses a Next.js frontend and a FastAPI backend. For local development, the backend currently defaults to SQLite.

## What It Does

### Design Creation

- Prompt-to-design generation
- Reference-image guided generation
- Sketch-to-design conversion
- Multi-style fusion generation
- AI-assisted recolor and fabric swap variations
- Color palette extraction, style suggestions, and fabric recommendations

### User Experience

- Account signup and login with JWT auth
- Personal design gallery
- Save and unsave designs
- Boards for organizing saved work
- Marketplace browsing for public designs and tailors

### Tailor Workflow

- Tailor registration with business profile fields
- Dedicated tailor portal
- Pending quotation requests visible before they become confirmed orders
- View details of the order
- Quote submission from the tailor portal

## Tech Stack

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React
- React Dropzone
- React Hot Toast

### Backend

- FastAPI
- SQLAlchemy 2
- Alembic
- Pydantic Settings
- JWT auth with `python-jose`
- Passlib / bcrypt

### AI and Media

- Gemini-backed image generation services
- sentence-transformers / transformers for style-related features
- Pillow for image processing
- S3-compatible object storage support

### Database

- Local default: SQLite (`fashion_fusion.db`)
- PostgreSQL-compatible dependencies are present for deployment scenarios

## Current Architecture

```text
frontend (Next.js)
  -> backend (FastAPI)
     -> AI services / media processing
     -> SQLite locally
     -> optional S3-compatible storage
```

## Repository Layout

```text
fashion-fusion/
|-- frontend/
|   |-- components/
|   |-- contexts/
|   |-- lib/
|   |-- pages/
|   `-- styles/
|-- backend/
|   |-- alembic/
|   |-- api/
|   |-- models/
|   |-- services/
|   |-- database/
|   |-- static/
|   `-- temp/
`-- README.md
```

## Main API Areas


Useful local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.9+

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd fashion-fusion
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python create_fresh_database.py
python main.py
```

Notes:

- local development defaults to `sqlite:///./fashion_fusion.db`
- `create_fresh_database.py` rebuilds the local SQLite database from scratch
- Alembic is configured in `backend/alembic.ini`

### 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

Important values:

```env
DATABASE_URL=sqlite:///./fashion_fusion.db
SECRET_KEY=change-me
JWT_SECRET=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

GOOGLE_API_KEY=
TRYON_API_KEY=

S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=
S3_ENDPOINT=

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Database Notes

### Local SQLite

The app currently runs well locally with SQLite. The main local database file is:

```text
backend/fashion_fusion.db
```

### Migrations

Alembic is present and configured. Typical command:

```bash
cd backend
alembic upgrade head
```

### Fresh rebuild

If you want to recreate the local database:

```bash
cd backend
python create_fresh_database.py
```



## Known Product Behavior

- A user order request is first a quotation request, not a confirmed order.
- Confirmed orders are created only after a user accepts a tailor quote.
- Tailor dashboard quote submission currently uses a simple browser-prompt flow from the UI.

## Testing

Backend:

```bash
cd backend
pytest
```

Frontend lint:

```bash
cd frontend
npm run lint
```

## Suggested Demo Flows

### User flow

1. Sign up as a normal user.
2. Generate a design.
3. Save it or open it in marketplace-style flows.
4. Click `Order` and submit a quotation request.
5. Check Track Orders for incoming tailor quotes.

### Tailor flow

1. Sign up as a tailor.
2. Open the Tailor Portal.
3. Review pending quotation requests.
4. Open full request details.
5. Submit a quote.

## Status Summary

Recent codebase improvements reflected in this README:

- cleaned auth routing to use a single active auth router
- stabilized SQLite + Alembic local migration behavior
- fixed tailor registration data consistency
- added self-healing tailor profile creation for older broken accounts
- surfaced tailor portal navigation in the frontend
- updated tailor portal to show quotation requests before order confirmation
- added detailed request review UI before quoting

## License

This repository does not currently include a separate license file in the workspace root. Add one if you want to publish or distribute the project under a specific license.
