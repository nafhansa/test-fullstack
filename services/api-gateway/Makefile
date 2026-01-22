.PHONY: help up down logs restart clean status test

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start Kong Gateway
	docker-compose up -d
	@echo "Kong Gateway started!"
	@echo "Gateway: http://localhost:3000"
	@echo "Admin API: http://localhost:8001"

down: ## Stop Kong Gateway
	docker-compose down

logs: ## Show Kong logs
	docker-compose logs -f kong

restart: ## Restart Kong Gateway
	docker-compose restart kong

clean: ## Remove all containers and volumes
	docker-compose down -v
	@echo "All data cleaned!"

status: ## Check Kong status
	@echo "=== Container Status ==="
	@docker-compose ps
	@echo ""
	@echo "=== Kong Health ==="
	@curl -s http://localhost:8001/status | jq '.' || echo "Kong not running"

test: ## Test API Gateway
	@echo "Testing Auth Register..."
	@curl -X POST http://localhost:3000/api/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email":"test@example.com","password":"123456","role":"PEMBELI"}' \
		|| echo "Auth service not ready"
	@echo "\n\nTesting Product List..."
	@curl -X GET http://localhost:3000/api/products || echo "Product service not ready"

install: ## First time setup
	@echo "Creating .env file..."
	@cp .env.example .env
	@echo "Starting Kong Gateway..."
	@make up
	@echo ""
	@echo "✅ Kong Gateway installed!"
	@echo "Next: Start backend services (auth, product, transaction)"
