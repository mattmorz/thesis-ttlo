#!/usr/bin/env bash
set -e

# Color helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}   TTLO Portal — Production Deployment Script       ${NC}"
echo -e "${GREEN}====================================================${NC}"

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker Engine first.${NC}"
    exit 1
fi

# Check Docker Compose installation
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose v2 is not installed or enabled.${NC}"
    exit 1
fi

# Check environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}PLEASE UPDATE SECRETS IN .env BEFORE GOING LIVE!${NC}"
    echo -e "${YELLOW}Press Ctrl+C to abort, or Enter to continue deployment...${NC}"
    read -r
fi

echo -e "\n${GREEN}[1/5] Building Docker Images...${NC}"
docker compose build --no-cache

echo -e "\n${GREEN}[2/5] Starting Database and Migration Runner...${NC}"
docker compose up -d db
docker compose up migration

echo -e "\n${GREEN}[3/5] Starting Web Application & Reverse Proxy...${NC}"
docker compose up -d web nginx

echo -e "\n${GREEN}[4/5] Verifying Service Health...${NC}"
echo "Waiting for services to reach healthy status..."
sleep 15

if docker compose ps | grep -q "unhealthy"; then
    echo -e "${RED}Warning: One or more containers are unhealthy!${NC}"
    docker compose ps
    exit 1
fi

echo -e "\n${GREEN}[5/5] Deployment Successful! Container Status:${NC}"
docker compose ps

echo -e "\n${GREEN}TTLO Portal is running at: http://localhost${NC}"
echo -e "${GREEN}To inspect live logs, run: docker compose logs -f${NC}"
