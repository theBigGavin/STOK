#!/bin/bash

# Stock Trading Backtest Decision System - Development Startup Script

set -e

echo "🚀 Starting Stock Trading Backtest Decision System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/migrations data/seeds logs

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env file not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "📝 Please update backend/.env with your actual configuration values."
fi

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U stock_user -d stock_system; do
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
done

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec api alembic upgrade head

# Seed initial data if needed
echo "🌱 Seeding initial data..."
docker-compose exec api python scripts/seed_data.py

# Check if all services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📊 Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update stock data: docker-compose exec api python scripts/update_stock_data.py"
echo ""
echo "🎯 Next steps:"
echo "   1. Update backend/.env with your stock data API credentials"
echo "   2. Access the frontend and configure your models"
echo "   3. Run data update script to populate initial stock data"