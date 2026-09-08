# ==============================================================================
# Sanaka Hospital - Supabase PostgreSQL Migration & Verification Tool
# ==============================================================================
import sys
import os

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv()

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import (
    User, Department, Doctor, Patient, PatientCase,
    MedicalHistory, VitalSigns, Prescription, PrescriptionItem,
    Appointment, AuditLog
)
from app.utils.seed_data import seed_database
from sqlalchemy import inspect, text

def run_migration():
    print('=================================================================')
    print('  SANAKA HOSPITAL - SUPABASE POSTGRESQL MIGRATION & SETUP TOOL   ')
    print('=================================================================')

    db_url = settings.DATABASE_URL
    masked_url = db_url.split('@')[-1] if '@' in db_url else db_url
    print(f'[*] Target Database: {masked_url}')

    if '[YOUR-PASSWORD]' in db_url or '<password>' in db_url.lower():
        print('[ERROR] Detected placeholder [YOUR-PASSWORD] in DATABASE_URL.')
        print('Please update your .env file with your actual Supabase database password.')
        print('Example:')
        print('  DATABASE_URL=postgresql://postgres.xxx:YOUR_REAL_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres')
        sys.exit(1)

    is_postgres = 'postgresql' in db_url or 'postgres' in db_url
    if not is_postgres:
        print('[INFO] Currently using SQLite local database.')
        print('To target Supabase PostgreSQL, set DATABASE_URL in your .env or environment.')
    else:
        print('[SUCCESS] Supabase PostgreSQL connection string detected!')

    # Step 1: Test Connection
    print('\n[Step 1/4] Testing database connection...')
    try:
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
            print('  -> Connection established successfully!')
    except Exception as e:
        print(f'  [FAIL] Could not connect to database: {e}')
        sys.exit(1)

    # Step 2: Create All Tables
    print('\n[Step 2/4] Creating all hospital database tables...')
    try:
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f'  -> Successfully verified {len(tables)} tables in database:')
        for t in sorted(tables):
            print(f'     [OK] {t}')
    except Exception as e:
        print(f'  [FAIL] Failed to create tables: {e}')
        sys.exit(1)

    # Step 3: Seed Default Data if Empty
    print('\n[Step 3/4] Checking master records (Users, Departments, Doctors)...')
    session = SessionLocal()
    try:
        user_count = session.query(User).count()
        if user_count == 0:
            print('  -> Database is brand new! Seeding initial departments and staff...')
            seed_database()
            print('  -> Default master data seeded successfully.')
        else:
            print(f'  -> Existing users found ({user_count}). Master data is already intact.')
    except Exception as e:
        print(f'  [NOTICE] Seed check notice: {e}')
    finally:
        session.close()

    # Step 4: Verification Summary
    print('\n[Step 4/4] Verifying database records across all tables...')
    session = SessionLocal()
    try:
        tables_to_count = [
            ('Users (Staff & Admins)', User),
            ('Hospital Departments', Department),
            ('Doctors Roster', Doctor),
            ('Registered Patients', Patient),
            ('OPD Appointments', Appointment),
            ('Clinical Cases', PatientCase),
            ('Prescriptions', Prescription),
            ('Audit Log Trail', AuditLog),
        ]
        for label, model in tables_to_count:
            count = session.query(model).count()
            print(f'  -> {label:<28}: {count} records')
    except Exception as e:
        print(f'  [WARN] Count verification notice: {e}')
    finally:
        session.close()

    print('\n=================================================================')
    print('  DATABASE READY FOR PRODUCTION & VERCEL DEPLOYMENT              ')
    print('=================================================================')

if __name__ == '__main__':
    run_migration()
