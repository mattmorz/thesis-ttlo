#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}   TTLO Portal — Production Update Script           ${NC}"
echo -e "${GREEN}====================================================${NC}"

echo -e "\n${GREEN}[1/5] Fetching latest Git updates...${NC}"
git pull origin main || echo -e "${YELLOW}Warning: git pull skipped or up to date.${NC}"

echo -e "\n${GREEN}[2/5] Building updated application image...${NC}"
docker compose build web migration

echo -e "\n${GREEN}[3/5] Executing database migrations...${NC}"
docker compose up migration

echo -e "\n${GREEN}[4/5] Reloading Web Application & Nginx...${NC}"
docker compose up -d --no-deps web
docker compose exec nginx nginx -s reload || docker compose restart nginx

echo -e "\n${GREEN}[5/5] Cleaning up old images...${NC}"
docker image prune -f

echo -e "\n${GREEN}Update Complete! Container Status:${NC}"
docker compose ps
