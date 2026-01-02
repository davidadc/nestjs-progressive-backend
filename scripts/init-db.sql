-- Initialize databases for NestJS Progressive Backend projects
-- This script runs automatically when PostgreSQL container starts

-- Beginner Level
CREATE DATABASE user_auth_db;
CREATE DATABASE crud_api_db;
CREATE DATABASE notes_app_db;
CREATE DATABASE blog_api_db;

-- Intermediate Level
CREATE DATABASE ecommerce_db;
CREATE DATABASE task_management_db;
CREATE DATABASE chat_app_db;
CREATE DATABASE file_upload_db;

-- Advanced Level
CREATE DATABASE social_media_db;
CREATE DATABASE payment_api_db;
CREATE DATABASE notification_db;
CREATE DATABASE admin_dashboard_db;

-- Expert Level
CREATE DATABASE microservices_db;
CREATE DATABASE streaming_db;
CREATE DATABASE saas_multitenant_db;
CREATE DATABASE recommendation_db;

-- Grant privileges to dev user
GRANT ALL PRIVILEGES ON DATABASE user_auth_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE crud_api_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE notes_app_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE blog_api_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE task_management_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE chat_app_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE file_upload_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE social_media_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE payment_api_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE admin_dashboard_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE microservices_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE streaming_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE saas_multitenant_db TO dev;
GRANT ALL PRIVILEGES ON DATABASE recommendation_db TO dev;

-- Log completion
\echo 'All project databases created successfully!'
