# Architecture - Separated Client/Server Structure

## Directory Structure

```
/Users/shimizumasaya/ULモノリス/
├── src/
│   └── v1/
│       ├── server/                     # Backend API Server
│       │   ├── controllers/           # API Controllers
│       │   │   ├── gear.controller.ts
│       │   │   ├── category.controller.ts
│       │   │   ├── llm.controller.ts
│       │   │   └── health.controller.ts
│       │   ├── services/              # Business Logic
│       │   │   ├── gearService.ts
│       │   │   ├── categoryService.ts
│       │   │   ├── llmService.ts
│       │   │   └── validationService.ts
│       │   ├── models/                # Data Models
│       │   │   ├── gear.model.ts
│       │   │   ├── category.model.ts
│       │   │   └── index.ts
│       │   ├── middleware/             # Express Middleware
│       │   │   ├── auth.middleware.ts
│       │   │   ├── validation.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── routes/                # API Routes
│       │   │   ├── gear.routes.ts
│       │   │   ├── category.routes.ts
│       │   │   ├── llm.routes.ts
│       │   │   └── index.ts
│       │   ├── utils/                 # Server Utilities
│       │   │   ├── sanitize.ts
│       │   │   ├── validation.ts
│       │   │   └── logger.ts
│       │   ├── config/                # Server Configuration
│       │   │   ├── database.ts
│       │   │   ├── llm.ts
│       │   │   └── server.ts
│       │   └── app.ts                 # Express App Entry
│       │
│       └── client/                    # Frontend React App
│           ├── components/            # React Components
│           │   ├── gear/
│           │   │   ├── GearForm.tsx
│           │   │   ├── GearTable.tsx
│           │   │   └── GearChart.tsx
│           │   ├── category/
│           │   │   └── CategoryManager.tsx
│           │   ├── chat/
│           │   │   └── ChatPopup.tsx
│           │   ├── auth/
│           │   │   └── Login.tsx
│           │   └── common/
│           │       ├── Layout.tsx
│           │       └── LoadingSpinner.tsx
│           ├── hooks/                 # Custom React Hooks
│           │   ├── useGear.ts
│           │   ├── useCategory.ts
│           │   └── useAuth.ts
│           ├── services/              # API Client Services
│           │   ├── api.client.ts
│           │   ├── gear.api.ts
│           │   ├── category.api.ts
│           │   └── llm.api.ts
│           ├── context/               # React Context
│           │   ├── AuthContext.tsx
│           │   └── AppContext.tsx
│           ├── types/                 # TypeScript Types
│           │   └── index.ts
│           ├── utils/                 # Client Utilities
│           │   ├── formatters.ts
│           │   └── constants.ts
│           ├── styles/                # Styling
│           │   └── index.css
│           └── main.tsx               # React App Entry
│
├── package.json                      # Root package.json
├── server.package.json              # Server dependencies
├── client.package.json              # Client dependencies
├── vite.config.ts                   # Client build config
├── server.config.ts                 # Server build config
└── docker-compose.yml               # Development environment
```

## API Endpoints to Implement

### Gear Management
- `GET /api/v1/gear` - Get all gear items
- `POST /api/v1/gear` - Create new gear item
- `PUT /api/v1/gear/:id` - Update gear item
- `DELETE /api/v1/gear/:id` - Delete gear item
- `PATCH /api/v1/gear/:id/quantity` - Update quantities

### Category Management
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create new category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### LLM Integration
- `POST /api/v1/llm/extract-gear` - Extract gear from prompt
- `POST /api/v1/llm/extract-url` - Extract gear from URL
- `POST /api/v1/llm/enhance-prompt` - Enhance URL data with prompt
- `POST /api/v1/llm/extract-category` - Extract category from prompt
- `POST /api/v1/llm/analyze-list` - Analyze gear list

### Health & Status
- `GET /api/v1/health` - Health check
- `GET /api/v1/status` - System status

## Separation of Concerns

### Server Responsibilities
- Data validation and sanitization
- Business logic processing
- Database operations
- LLM API integration
- Authentication and authorization
- Error handling and logging

### Client Responsibilities
- User interface rendering
- User input handling
- State management (UI state only)
- API communication
- Client-side validation (UX only)
- Routing and navigation

