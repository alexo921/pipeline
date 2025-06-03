# Pipeline

A modern project management platform built with Next.js, NestJS, and PostgreSQL.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Docker Desktop
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pipeline.git
cd pipeline
```

2. Install dependencies:
```bash
# Install root dependencies
pnpm install

# Install frontend dependencies
cd frontend/web-dashboard
pnpm install

# Install backend dependencies
cd ../../backend/api
pnpm install
```

3. Start the development environment:
```bash
# Start Docker containers (from root directory)
docker-compose up -d

# Start backend (from backend/api directory)
pnpm start:dev

# Start frontend (from frontend/web-dashboard directory)
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

```
/pipeline
├── frontend/
│   └── web-dashboard/      # Next.js frontend
├── backend/
│   └── api/               # NestJS backend
└── docker-compose.yml     # Docker services configuration
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create a task
- `GET /api/tasks/:id` - Get task details
- `PATCH /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a user
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update a user
- `DELETE /api/users/:id` - JWT_SECRET=8f45d7e9a2b3c1f6e8d0a4b7c2f5e9d3a6b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0a3b6c9f2e5d8a1b4c7f0e3d6a9b2c5f8e1d4a7b0c3f6e9d2a5b8c1f4e7d0aDelete a user

## Development

### Database

The project uses PostgreSQL for data storage. The database is automatically created and configured when you run `docker-compose up -d`.

Default database credentials:
- Host: localhost
- Port: 5432
- Database: pipeline_development_db
- Username: admin
- Password: password

### Environment Variables

Create a `.env` file in the `backend/api` directory:

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/pipeline_development_db
JWT_SECRET=your-secret-key
```

To generate a secure JWT secret key, you can use one of these methods:

1. Using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. Using OpenSSL:
```bash
openssl rand -hex 64
```

Replace `your-secret-key` with the generated value. Keep this secret secure and never commit it to version control.

### Available Scripts

#### Backend (in `backend/api` directory)
- `pnpm start:dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start:prod` - Start production server
- `pnpm test` - Run tests

#### Frontend (in `frontend/web-dashboard` directory)
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT
