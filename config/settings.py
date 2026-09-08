import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / '.env')

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-secret-key-rachana')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['*']

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Custom apps
    'core',
    'accounts',
    'products',
    'cart',
    'wishlist',
    'orders',
    'coupons',
    'reviews',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                # Custom context processors
                'core.context_processors.site_context',
                'cart.context_processors.cart_context',
                'wishlist.context_processors.wishlist_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


# Database
# Database Configuration
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL') or os.getenv('SUPABASE_DB_URL')
parsed_db = None

if DATABASE_URL and DATABASE_URL.strip() and '[YOUR-PASSWORD]' not in DATABASE_URL and '<password>' not in DATABASE_URL.lower():
    try:
        import dj_database_url
        parsed_db = dj_database_url.parse(
            DATABASE_URL.strip(),
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require='sqlite' not in DATABASE_URL
        )
    except Exception:
        parsed_db = None

if parsed_db:
    DATABASES = {'default': parsed_db}
else:
    DB_NAME = os.getenv('DB_NAME') or os.getenv('DATABASE_NAME')
    DB_USER = os.getenv('DB_USER') or os.getenv('DATABASE_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD') or os.getenv('DATABASE_PASSWORD')
    DB_HOST = os.getenv('DB_HOST') or os.getenv('DATABASE_HOST')
    DB_PORT = os.getenv('DB_PORT') or os.getenv('DATABASE_PORT')

    if DB_NAME and DB_USER and DB_PASSWORD:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': DB_NAME,
                'USER': DB_USER,
                'PASSWORD': DB_PASSWORD,
                'HOST': DB_HOST or 'localhost',
                'PORT': DB_PORT or '5432',
                'OPTIONS': {
                    'sslmode': 'require' if DB_HOST and DB_HOST != 'localhost' else 'prefer',
                }
            }
        }
    else:
        # Fallback to SQLite for seamless local testing
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'static_collected'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'dashboard'
LOGOUT_REDIRECT_URL = 'home'

# Bootstrap / Tailwind Message Tags mapping to css classes
from django.contrib.messages import constants as messages
MESSAGE_TAGS = {
    messages.DEBUG: 'bg-gray-100 text-gray-800 border-gray-300',
    messages.INFO: 'bg-blue-100 text-blue-800 border-blue-300',
    messages.SUCCESS: 'bg-green-100 text-green-800 border-green-300',
    messages.WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    messages.ERROR: 'bg-red-100 text-red-800 border-red-300',
}
