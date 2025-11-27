# ChromaDB Setup Guide for Roomatinder

This guide explains how to set up ChromaDB for vector-based profile matching in Roomatinder.

## What is ChromaDB?

ChromaDB is an open-source vector database that allows storing and querying documents using embeddings (vector representations). In Roomatinder, we use ChromaDB to index user profiles for similarity-based matching.

## Prerequisites

- Docker installed (recommended) OR Python 3.8+ for local installation
- Node.js 18+ (already required for the project)

---

## Option 1: Using Docker (Recommended)

### Quick Start

Run ChromaDB using Docker with a single command:

```bash
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v chromadb_data:/chroma/chroma \
  chromadb/chroma
```

This will:
- Start ChromaDB in the background (`-d`)
- Name the container `chromadb`
- Expose the API on port 8000
- Persist data in a Docker volume named `chromadb_data`

### Verify it's running

```bash
# Check container status
docker ps | grep chromadb

# Test the API
curl http://localhost:8000/api/v1/heartbeat
```

Expected response: `{"nanosecond heartbeat": ...}`

### Stop ChromaDB

```bash
docker stop chromadb
```

### Start ChromaDB again

```bash
docker start chromadb
```

### Remove ChromaDB (keeps data)

```bash
docker stop chromadb
docker rm chromadb
```

### Remove ChromaDB with data

```bash
docker stop chromadb
docker rm chromadb
docker volume rm chromadb_data
```

---

## Option 2: Using Docker Compose

Create a `docker-compose.chromadb.yml` file in the project root:

```yaml
version: '3.8'

services:
  chromadb:
    image: chromadb/chroma:latest
    container_name: roomatinder-chromadb
    ports:
      - "8000:8000"
    volumes:
      - chromadb_data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
      - ANONYMIZED_TELEMETRY=FALSE
    restart: unless-stopped

volumes:
  chromadb_data:
```

Then run:

```bash
docker-compose -f docker-compose.chromadb.yml up -d
```

---

## Option 3: Local Installation (Python)

If you prefer not to use Docker:

```bash
# Create a virtual environment
python -m venv chroma-env
source chroma-env/bin/activate  # On Windows: chroma-env\Scripts\activate

# Install ChromaDB
pip install chromadb

# Start the server
chroma run --path ./chroma_data --port 8000
```

---

## Installing the ChromaDB Client

After setting up the server, install the client package in your project:

```bash
npm install chromadb
```

---

## Configuration

By default, the service connects to `http://localhost:8000`. To use a different host, set the environment variable:

```bash
# In .env.local
CHROMA_HOST=http://localhost:8000
```

Or for production:

```bash
CHROMA_HOST=http://your-chromadb-server:8000
```

---

## Verifying the Integration

### 1. Create a test profile

Create a new profile through the web interface at `/profile`.

### 2. List all indexed profiles

Run the standalone script to verify profiles are being indexed:

```bash
npx ts-node scripts/list-chroma-profiles.ts
```

Or if you have `tsx` installed:

```bash
npx tsx scripts/list-chroma-profiles.ts
```

---

## Troubleshooting

### "Cannot connect to ChromaDB server"

1. Verify ChromaDB is running:
   ```bash
   docker ps | grep chromadb
   ```

2. Check if the port is accessible:
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```

3. Check Docker logs:
   ```bash
   docker logs chromadb
   ```

### "Collection does not exist"

This is normal if no profiles have been created yet. Create a profile through the app to initialize the collection.

### Profile creation works but ChromaDB shows errors

ChromaDB indexing is non-blocking. Profile creation will succeed even if ChromaDB is down. Check the server logs for detailed error messages.

---

## Data Structure

Each profile is stored in ChromaDB with:

- **ID**: The Firebase user ID (UUID)
- **Document**: A text representation of the profile for semantic search
- **Metadata**: All profile fields encoded as key-value pairs

### Metadata encoding rules:
- Strings, numbers, booleans: stored as-is
- Arrays: JSON stringified
- Dates: ISO string format
- null/undefined: empty string

---

## Collection Info

- **Collection Name**: `user_profiles`
- **Default Host**: `http://localhost:8000`

---

## Production Considerations

1. **Persistence**: Use Docker volumes or mounted directories to persist data
2. **Authentication**: Consider using ChromaDB's authentication features
3. **Scaling**: ChromaDB supports clustering for high availability
4. **Backups**: Regularly backup the ChromaDB data volume

For production deployment options, see: https://docs.trychroma.com/deployment
