# Bhagavad-Gita Backend

Backend API for Bhagavad-Gita mobile applications (v2012).

## Requirements

- Node.js 18+
- Supabase project with configured database

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
```

## Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
```

## Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### v2012 API (for mobile apps)

All endpoints use POST method and return:
```json
{
  "code": 0,
  "msg": "",
  "data": [...]
}
```

| Endpoint | Description |
|----------|-------------|
| `POST /api/Data/Languages` | Get all languages |
| `POST /api/Data/Books` | Get books (optional `ids` filter) |
| `POST /api/Data/Chapters` | Get chapters with slokas (`bookId` required) |
| `POST /api/Data/Quotes` | Get random quote |

### Storage

| Endpoint | Description |
|----------|-------------|
| `GET /Files/*` | Redirect to Supabase Storage (audio files) |

## Headers

- `Accept-Language: en` - Language preference (default: en)
- `Authorization: Gita {token}` - Optional auth token

## Database Tables

- `Languages` - Language definitions
- `Books` - Book translations per language
- `Chapters` - Chapter metadata
- `Slokas` - Verses with text, translation, audio
- `Vocabularies` - Word definitions per sloka
- `Quotes` - Daily quotes

## Project Structure

```
src/
  config/
    supabase.js       # Supabase client
  routes/
    v2012/
      index.js        # Route mounting
      languages.js    # Languages endpoint
      books.js        # Books endpoint
      chapters.js     # Chapters endpoint
      quotes.js       # Quotes endpoint
    legacyStorage.js  # /Files/* redirect
  transformers/
    v2012/
      languageTransformer.js
      bookTransformer.js
      chapterTransformer.js
      quoteTransformer.js
  services/
    storageService.js # Storage URL builder
  utils/
    response.js       # v2012 response helpers
  index.js            # Express app
```
