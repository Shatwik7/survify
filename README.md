# Survey Management Application

A full-stack survey management application built with NestJS backend, React frontend, PostgreSQL database, and Redis for caching. The application allows users to create surveys, manage questionnaires, handle population data, and analyze survey responses.

## 🚀 Quick Start

### Prerequisites

Before running the application, ensure you have the following installed:

- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/downloads)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shatwik7/survify
   cd survify 
   ```

2. **Create environment file**
   ```bash
   # Create a .env file in the root directory
   touch .env
   ```

3. **Configure environment variables**
   Add the following variables to your `.env` file:
   ```env
   # Database Configuration  not nessassary when running using docker compose
   POSTGRES_USER=postgres       
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=mydatabase
   POSTGRES_HOST=postgres
   POSTGRES_PORT=5432

   # Redis Configuration  not nessassary when running using docker compose
   REDIS_HOST=redis
   REDIS_PORT=6379

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h

   # Application Configuration
   NODE_ENV=production
   PORT=3000

   # OPEN AI KEYS 
    AZURE_OPENAI_API_KEY=
    AZURE_OPENAI_ENDPOINT=
    AZURE_OPENAI_API_VERSION=2024-05-01-preview
    AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

   # AWS KEYS
   not nessassary when running locally just set STORAGE_DRIVER="local"
   
   STORAGE_DRIVER="s3" || "local"
   AWS_REGION=
   AWS_ACCESS_KEY=
   AWS_SECRET_KEY=
   AWS_BUCKET_NAME=

   # GAMIL USER FOR SENDING EMAILS
   not nessassary when running locally
   GMAIL_USER=
   GMAIL_PASSWORD=   or        GMAIL_APP_PASSWORD= 
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Wait for services to start**
   The application will take a few minutes to build and start all services. You can monitor the progress with:
   ```bash
   docker-compose logs -f
   ```

### Accessing the Application

Once all services are running, you can access the application at:

- **Frontend**: http://localhost:80 or http://localhost:8080
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432 (PostgreSQL)
- **Redis**: localhost:6379




## 🔧 Configuration

### Environment Variables

The application uses environment variables for configuration. Key variables include:

- `POSTGRES_*`: Database connection settings
- `REDIS_*`: Redis connection settings
- `JWT_*`: JWT authentication settings
- `NODE_ENV`: Application environment
- `PORT`: Application port

### Database Setup

The PostgreSQL database is automatically initialized with the following default credentials:
- **Username**: postgres
- **Password**: postgres
- **Database**: mydatabase

### File Uploads

SET THE ENV STORAGE_DRIVER TO "local" when running on local dev envirnment and to "s3" when running multiple instance.
The application supports file uploads with a maximum size of 2GB. Uploaded files are stored in the configured upload directory.

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check if ports are in use
   netstat -an | findstr :80
   netstat -an | findstr :3000
   netstat -an | findstr :5432
   ```

2. **Docker not running**
   - Ensure Docker Desktop is started
   - Check Docker service status

3. **Build failures**
   ```bash
   # Clean and rebuild
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

4. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Restart database
   docker-compose restart postgres
   ```

## 📚 Documentation

- **API Documentation**: Available at `server/API_Documentation.md`
