# SkillSwap Backend

A Django REST Framework backend for the SkillSwap skill exchange platform.

## Features

- Django REST Framework for API endpoints
- MongoDB integration using djongo with dedicated client layer
- JWT authentication with SimpleJWT
- Django Channels for WebSocket support (ready for messaging)
- CORS configuration for frontend integration
- Stripe integration for payments (test mode)
- Centralized environment configuration with validation
- Hugging Face API integration for ML models

## Local Setup

### Prerequisites

- Python 3.8+
- MongoDB (local installation or MongoDB Compass)
- Virtual environment (recommended)

### Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd Backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or
   source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration values. **All environment variables are validated at startup** - missing required variables will cause the application to fail with descriptive error messages.

5. **Setup MongoDB:**
   - Install MongoDB locally or use MongoDB Compass
   - Default connection string: `mongodb://localhost:27017/skillswap`
   - Update `MONGODB_URI` in `.env` if using different connection

6. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

7. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/`

## MongoDB Compass Connection

To connect MongoDB Compass to your local database:

1. Open MongoDB Compass
2. Use connection string: `mongodb://localhost:27017/skillswap`
3. Click "Connect"

## API Endpoints

- Admin: `http://localhost:8000/admin/`
- API Root: `http://localhost:8000/api/`

## Environment Variables

The application validates all required environment variables at startup:

### Required Variables
- `SECRET_KEY` - Django secret key
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key (test mode)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (test mode)
- `HF_TOKEN` - Hugging Face API token for ML model integration

### Optional Variables
- `DEBUG` - Debug mode (defaults to False)

## MongoDB Client Layer

The application includes a dedicated MongoDB client layer (`api/db.py`) with helper functions:
- `get_database()` - Get database instance
- `get_collection(name)` - Get collection by name
- `health_check()` - Test MongoDB connection
- `close_connection()` - Gracefully close connection

## Project Structure

```
Backend/
├── skillswap/          # Django project settings
│   ├── settings.py     # Main Django settings
│   └── settings_env.py # Centralized environment config
├── api/                # Main API application
│   └── db.py          # MongoDB client layer
├── manage.py           # Django management script
├── requirements.txt    # Python dependencies
├── env.example         # Environment variables template
└── .gitignore         # Git ignore rules
```

## Dependencies

- Django 5.2.7
- Django REST Framework
- djongo (MongoDB integration)
- django-cors-headers
- djangorestframework-simplejwt
- channels (WebSocket support)
- dj-rest-auth
- stripe (payment processing)
- python-dotenv
