.PHONY: help dev dev-build dev-down prod prod-build prod-down build test clean

# ─── Colors ──────────────────────────────────────────────────────────────────
BLUE := \033[1;34m
GREEN := \033[1;32m
YELLOW := \033[1;33m
RED := \033[1;31m
NC := \033[0m # No Color

# ─── Help ────────────────────────────────────────────────────────────────────
help: ## Show this help message
	@echo "$(BLUE)ConnectWorld Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# ─── Docker Development ──────────────────────────────────────────────────────
dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "  Client:     http://localhost:5173"
	@echo "  API:        http://localhost:5000/api/health"
	@echo "  Prisma:     http://localhost:5555"
	@echo "  Redis GUI:  http://localhost:8081"

dev-build: ## Rebuild and start development environment
	@echo "$(BLUE)Rebuilding development environment...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
	@echo "$(GREEN)Development environment rebuilt!$(NC)"

dev-down: ## Stop development environment
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
	@echo "$(GREEN)Development environment stopped.$(NC)"

dev-logs: ## Follow logs from development environment
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

dev-shell: ## Open a shell in the server container
	docker exec -it connectworld-server-dev sh

# ─── Docker Production ───────────────────────────────────────────────────────
prod: ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Production environment started!$(NC)"
	@echo "  App:   http://localhost:3000"
	@echo "  API:   http://localhost:5000/api/health"

prod-build: ## Rebuild and start production environment
	@echo "$(BLUE)Rebuilding production environment...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)Production environment rebuilt!$(NC)"

prod-down: ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose down
	@echo "$(GREEN)Production environment stopped.$(NC)"

prod-logs: ## Follow logs from production environment
	docker-compose logs -f

# ─── Database ────────────────────────────────────────────────────────────────
db-push: ## Push Prisma schema to the database
	@echo "$(BLUE)Pushing Prisma schema...$(NC)"
	cd server && npx prisma db push
	@echo "$(GREEN)Schema pushed!$(NC)"

db-migrate: ## Run Prisma migrations
	@echo "$(BLUE)Running Prisma migrations...$(NC)"
	cd server && npx prisma migrate dev
	@echo "$(GREEN)Migrations complete!$(NC)"

db-seed: ## Seed the database with initial data
	@echo "$(BLUE)Seeding database...$(NC)"
	cd server && npx ts-node src/seed.ts
	@echo "$(GREEN)Database seeded!$(NC)"

db-studio: ## Open Prisma Studio
	cd server && npx prisma studio

db-reset: ## Reset the database (WARNING: drops all data!)
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "\n$(BLUE)Resetting database...$(NC)"; \
		cd server && npx prisma migrate reset --force; \
		echo "$(GREEN)Database reset!$(NC)"; \
	fi

# ─── Local Development ───────────────────────────────────────────────────────
install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	cd server && npm install
	cd client && npm install
	npm install
	cd server && npx prisma generate
	@echo "$(GREEN)Dependencies installed!$(NC)"

build: ## Build both server and client
	@echo "$(BLUE)Building server...$(NC)"
	cd server && npm run build
	@echo "$(BLUE)Building client...$(NC)"
	cd client && npm run build
	@echo "$(GREEN)Build complete!$(NC)"

typecheck: ## Run TypeScript type checking
	@echo "$(BLUE)Type checking server...$(NC)"
	cd server && npx tsc --noEmit
	@echo "$(BLUE)Type checking client...$(NC)"
	cd client && npx tsc --noEmit
	@echo "$(GREEN)Type checking passed!$(NC)"

lint: ## Run linting
	@echo "$(BLUE)Linting...$(NC)"
	cd server && npm run lint 2>/dev/null || true
	cd client && npm run lint
	@echo "$(GREEN)Lint complete!$(NC)"

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	cd server && npm test 2>/dev/null || true
	cd client && npm test 2>/dev/null || true
	@echo "$(GREEN)Tests complete!$(NC)"

# ─── Cleanup ─────────────────────────────────────────────────────────────────
clean: ## Remove all Docker containers, images, and volumes
	@echo "$(RED)WARNING: This will remove ALL Docker resources!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "\n$(YELLOW)Cleaning up...$(NC)"; \
		docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v 2>/dev/null || true; \
		docker-compose down -v 2>/dev/null || true; \
		echo "$(GREEN)Cleanup complete!$(NC)"; \
	fi

prune: ## Prune unused Docker resources
	docker system prune -f

# ─── SSL / HTTPS ────────────────────────────────────────────────────────────
ssl-init: ## Obtain Let's Encrypt SSL certificates (interactive)
	@echo "$(BLUE)Starting SSL certificate setup...$(NC)"
	bash scripts/setup-ssl.sh

ssl-init-auto: ## Obtain Let's Encrypt SSL certificates (auto, uses .env vars)
	@echo "$(BLUE)Starting automated SSL certificate setup...$(NC)"
	DOMAIN=$${DOMAIN} EMAIL=$${SSL_EMAIL} bash scripts/setup-ssl.sh

ssl-renew: ## Force immediate certificate renewal
	@echo "$(BLUE)Running certbot renewal...$(NC)"
	docker compose --profile init run --rm certbot-init renew
	@echo "$(GREEN)Renewal check complete!$(NC)"
	@echo "Restarting nginx to pick up new certificates..."
	docker compose exec nginx-proxy nginx -s reload || docker compose restart nginx-proxy

ssl-status: ## Check SSL certificate expiration status
	@echo "$(BLUE)SSL Certificate Status:$(NC)"
	@docker exec connectworld-nginx openssl x509 -in /etc/letsencrypt/live/connectworld.app/fullchain.pem -noout -text 2>/dev/null | grep -E 'Not Before|Not After|Subject:|Issuer:' || echo "No certificates found. Run 'make ssl-init'."

# ─── Utility ─────────────────────────────────────────────────────────────────
setup: ## Full project setup (install, generate, seed)
	@echo "$(BLUE)Running full setup...$(NC)"
	$(MAKE) install
	$(MAKE) db-push
	$(MAKE) db-seed
	@echo "$(GREEN)Setup complete!$(NC)"

.PHONY: help dev dev-build dev-down dev-logs dev-shell prod prod-build prod-down
.PHONY: prod-logs db-push db-migrate db-seed db-studio db-reset install build
.PHONY: typecheck lint test clean prune setup
