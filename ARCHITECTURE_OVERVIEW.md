# Pipeline Workforce Platform - Architecture Overview

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Pipeline Workforce Platform              │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Web         │ │ Mobile      │ │ Admin       │          │
│  │ Dashboard   │ │ App         │ │ Panel       │          │
│  │ (Next.js)   │ │ (React      │ │ (Next.js)   │          │
│  │ Port: 3000  │ │ Native)     │ │ Port: 3002  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  API Gateway & Load Balancer                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Nginx (SSL Termination, Static Files, Proxy)           ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Backend API (NestJS) - Port: 3001                      ││
│  │ • Authentication & Authorization                        ││
│  │ • User Management                                       ││
│  │ • Job Management                                        ││
│  │ • Resume Processing                                     ││
│  │ • Email Services                                        ││
│  │ • Analytics & Reporting                                 ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  AI & ML Layer                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ LLM Server  │ │ Pip         │ │ Resume      │          │
│  │ (Jan AI)    │ │ Chatbot     │ │ Parser      │          │
│  │ Port: 1337  │ │ (Rasa)      │ │ (Python)    │          │
│  │             │ │ Port: 5005  │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ PostgreSQL  │ │ Redis       │ │ ChromaDB    │          │
│  │ (Primary)   │ │ (Cache)     │ │ (Vector)    │          │
│  │ Port: 5432  │ │ Port: 6379  │ │ Port: 8000  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

### Request Flow

```
1. User Request
   ↓
2. Nginx (Load Balancer/SSL)
   ↓
3. Frontend Application (Next.js/React Native)
   ↓
4. Backend API (NestJS)
   ↓
5. Database Layer (PostgreSQL/Redis/ChromaDB)
   ↓
6. AI Services (if needed)
   ↓
7. Response back to User
```

### Authentication Flow

```
1. User Login Request
   ↓
2. Backend API validates credentials
   ↓
3. JWT token generated
   ↓
4. Token stored in secure cookie/localStorage
   ↓
5. Subsequent requests include token
   ↓
6. Backend validates token on each request
```

## 🏛️ Component Architecture

### 1. Frontend Layer

#### Web Dashboard (`frontend/web-dashboard/`)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Authentication**: JWT tokens stored in secure cookies

**Key Features**:
- Server-side rendering (SSR) for SEO
- Static site generation (SSG) for performance
- Role-based routing and access control
- Real-time updates via WebSocket connections
- Progressive Web App (PWA) capabilities

#### Mobile App (`frontend/mobile-app/`)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: React Query + Context API
- **Platform Support**: iOS, Android, Web

**Key Features**:
- Cross-platform compatibility
- Native performance optimizations
- Offline-first architecture
- Push notifications support
- Biometric authentication

#### Admin Panel (`admin-panel/`)
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Purpose**: System administration and management

**Key Features**:
- User management interface
- System monitoring dashboard
- Analytics and reporting tools
- Content management system
- Audit logging interface

### 2. API Layer

#### Backend API (`backend/api/`)
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: JWT with Passport.js
- **Documentation**: Swagger/OpenAPI

**Architecture Pattern**: Modular monolith with clear separation of concerns

**Key Modules**:
```
src/
├── auth/           # Authentication & Authorization
├── users/          # User management
├── jobs/           # Job management
├── applications/   # Application processing
├── resumes/        # Resume processing
├── email/          # Email services
├── analytics/      # Analytics & reporting
├── common/         # Shared utilities
└── config/         # Configuration management
```

**Key Features**:
- RESTful API design
- Input validation with DTOs
- Error handling middleware
- Rate limiting and throttling
- Background job processing with BullMQ
- File upload handling
- Email service integration

### 3. AI & ML Layer

#### LLM Server (Jan AI)
- **Purpose**: Local AI model hosting
- **Model**: Llama 3.1 8B with healthcare LoRA adapter
- **Interface**: OpenAI-compatible API
- **Features**: Healthcare-focused conversations

#### Pip Chatbot (Rasa)
- **Framework**: Rasa Open Source
- **Purpose**: Conversational AI for shift assistance
- **Features**: 
  - Natural language understanding (NLU)
  - Dialogue management
  - Custom actions for backend integration
  - Healthcare domain specialization

#### Resume Parser
- **Language**: Python
- **Libraries**: spaCy, NLTK, Streamlit
- **Purpose**: Advanced NLP-based resume analysis
- **Features**:
  - Multi-format support (PDF, DOC, etc.)
  - Skill extraction
  - Experience parsing
  - Data visualization

### 4. Data Layer

#### PostgreSQL (Primary Database)
- **Purpose**: Primary data storage
- **ORM**: Prisma
- **Features**:
  - ACID compliance
  - Complex queries and relationships
  - Full-text search capabilities
  - Backup and recovery

**Key Tables**:
- `users` - User accounts and profiles
- `jobs` - Job postings
- `applications` - Job applications
- `resumes` - Parsed resume data
- `analytics` - Platform metrics
- `chat_messages` - AI chat conversations

#### Redis (Caching Layer)
- **Purpose**: Session storage, caching, and job queues
- **Features**:
  - In-memory data storage
  - Session management
  - API response caching
  - Background job queues

#### ChromaDB (Vector Database)
- **Purpose**: AI embeddings and semantic search
- **Features**:
  - Vector similarity search
  - Document embeddings
  - Semantic job matching
  - Knowledge base storage

## 🔐 Security Architecture

### Authentication & Authorization

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│                 │    │                 │    │                 │
│ 1. Login Form   │───▶│ 2. Validate     │───▶│ 3. Check User   │
│                 │    │    Credentials  │    │    Credentials  │
│                 │    │                 │    │                 │
│ 4. Store JWT    │◀───│ 3. Generate JWT │◀───│ 4. Return User  │
│    Token        │    │    Token        │    │    Data         │
│                 │    │                 │    │                 │
│ 5. Include JWT  │───▶│ 6. Validate JWT │    │                 │
│    in Requests  │    │    & Check Role │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Security Measures

1. **Authentication**:
   - JWT tokens with expiration
   - Secure cookie storage
   - Password hashing with bcrypt
   - Multi-factor authentication (planned)

2. **Authorization**:
   - Role-based access control (RBAC)
   - Resource-level permissions
   - API endpoint protection
   - Frontend route guards

3. **Data Protection**:
   - HTTPS/TLS encryption
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection

4. **Infrastructure Security**:
   - Docker container isolation
   - Network segmentation
   - Regular security updates
   - Monitoring and logging

## 📊 Scalability Architecture

### Horizontal Scaling Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   API Servers   │    │   Database      │
│   (Nginx)       │    │   (Multiple)    │    │   (PostgreSQL)  │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │   SSL     │  │    │  │  Server 1 │  │    │  │  Primary  │  │
│  │Termination│  │    │  └───────────┘  │    │  │  Database │  │
│  └───────────┘  │    │  ┌───────────┐  │    │  └───────────┘  │
│  ┌───────────┐  │    │  │  Server 2 │  │    │  ┌───────────┐  │
│  │  Static   │  │    │  └───────────┘  │    │  │  Read     │  │
│  │   Files   │  │    │  ┌───────────┐  │    │  │  Replica  │  │
│  └───────────┘  │    │  │  Server 3 │  │    │  └───────────┘  │
└─────────────────┘    │  └───────────┘  │    └─────────────────┘
                       └─────────────────┘
```

### Performance Optimization

1. **Frontend Optimization**:
   - Code splitting and lazy loading
   - Image optimization and CDN
   - Service worker caching
   - Bundle size optimization

2. **Backend Optimization**:
   - Database query optimization
   - Redis caching layer
   - Connection pooling
   - Background job processing

3. **Database Optimization**:
   - Proper indexing strategy
   - Query optimization
   - Connection pooling
   - Read replicas for scaling

4. **Infrastructure Optimization**:
   - CDN for static assets
   - Load balancing
   - Auto-scaling groups
   - Monitoring and alerting

## 🔄 Deployment Architecture

### Production Deployment Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │   Staging       │    │   Production    │
│   Environment   │    │   Environment   │    │   Environment   │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │   Local   │  │    │  │   Test    │  │    │  │   Live    │  │
│  │  Docker   │  │    │  │  Server   │  │    │  │  Server   │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│                 │    │                 │    │                 │
│  Git Push       │───▶│  Automated      │───▶│  Manual/        │
│                 │    │  Testing        │    │  Automated      │
│                 │    │                 │    │  Deployment     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### CI/CD Pipeline

1. **Code Commit**: Developer pushes to feature branch
2. **Pull Request**: Code review and automated testing
3. **Merge to Main**: Automated deployment to staging
4. **Staging Tests**: Integration and E2E testing
5. **Production Deployment**: Manual approval and deployment
6. **Monitoring**: Health checks and performance monitoring

## 📈 Monitoring & Observability

### Monitoring Stack

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Infrastructure│    │   Business      │
│   Monitoring    │    │   Monitoring    │    │   Metrics       │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │   Error   │  │    │  │    CPU    │  │    │  │   User    │  │
│  │ Tracking  │  │    │  │  Memory   │  │    │  │ Activity  │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │Performance│  │    │  │  Network  │  │    │  │   Job     │  │
│  │Monitoring │  │    │  │   Usage   │  │    │  │ Matches   │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Metrics

1. **Application Metrics**:
   - API response times
   - Error rates
   - Database query performance
   - User session duration

2. **Infrastructure Metrics**:
   - CPU and memory usage
   - Disk I/O and network usage
   - Container health and resource usage
   - SSL certificate status

3. **Business Metrics**:
   - User registration and retention
   - Job posting and application rates
   - AI matching accuracy
   - Platform engagement metrics

## 🔮 Future Architecture Considerations

### Planned Enhancements

1. **Microservices Migration**:
   - Split monolithic API into microservices
   - Service mesh implementation
   - API gateway pattern

2. **Advanced AI Integration**:
   - Multi-model AI architecture
   - Real-time AI processing
   - Edge computing for AI inference

3. **Global Scalability**:
   - Multi-region deployment
   - CDN optimization
   - Database sharding strategy

4. **Advanced Analytics**:
   - Real-time analytics pipeline
   - Machine learning model serving
   - Predictive analytics infrastructure

---

This architecture provides a solid foundation for the Pipeline Workforce Platform while maintaining flexibility for future growth and enhancements.
