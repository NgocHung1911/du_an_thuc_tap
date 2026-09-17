# Deploy on Render

Use **New > Blueprint** and select this repository. Enter all variables marked
`sync: false` in Render; their names and local examples are in the two
`.env.example` files.

Set the following production URLs before the frontend build:

```text
FRONTEND_URL=https://<frontend>.onrender.com
CORS_ALLOWED_ORIGINS=https://<frontend>.onrender.com
VITE_API_BASE_URL=https://<backend>.onrender.com/api
VITE_WS_URL=https://<backend>.onrender.com/ws
```

Flyway creates a new schema using `V1__initial_schema.sql`. Existing databases
are baselined at version 0; back up and validate the schema before first deploy.
