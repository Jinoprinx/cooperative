# Backend CORS Configuration Required

## Issue
The backend is currently configured to only allow requests from `http://localhost:3000`, but the production frontend is deployed at `https://cooperative-kappa.vercel.app`.

## Error Message
```
Access to XMLHttpRequest at 'https://coopbkend-acfb9cb075e5.herokuapp.com/api/transactions/history?limit=5' from origin 'https://cooperative-kappa.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' that is not equal to the supplied origin.
```

## Required Backend Changes

### 1. Update CORS Configuration
In your backend server configuration (usually in `app.js`, `server.js`, or similar), update the CORS settings:

**If using Express.js with cors middleware:**
```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',                    // For local development
    'https://cooperative-kappa.vercel.app'     // For production frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

**Alternative manual CORS setup:**
```javascript
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://cooperative-kappa.vercel.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

### 2. Environment Variables (Recommended)
Set up environment variables in your backend:

**For development (.env.development):**
```
FRONTEND_URL=http://localhost:3000
```

**For production (Heroku config vars):**
```
FRONTEND_URL=https://cooperative-kappa.vercel.app
```

**Then use in code:**
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 3. Heroku Configuration
If using Heroku, set the environment variable:
```bash
heroku config:set FRONTEND_URL=https://cooperative-kappa.vercel.app -a coopbkend
```

## Testing
After making these changes:
1. Deploy the updated backend to Heroku
2. Test API calls from the production frontend
3. Check browser console for any remaining CORS errors

## Frontend Workaround (Already Implemented)
The frontend has been configured with:
- API proxy through Next.js rewrites (routes `/api/*` to backend)
- Environment-specific API URLs
- Proper error handling for CORS issues