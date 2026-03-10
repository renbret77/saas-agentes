import os
import sys

# URL derived from registry.json for Seguros RB
os.environ["DATABASE_URL"] = "postgresql://postgres.ddvbovjvahmcwmnnxnnt:CargasRene2109@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

import psycopg2

def run_migration(sql_file_path):
    conn = None
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        conn.autocommit = True
        with conn.cursor() as cur:
            with open(sql_file_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            cur.execute(sql_content)
            print(f"✅ Migration successfully executed: {sql_file_path}")
    except Exception as e:
        print(f"❌ Error executing migration: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration(sys.argv[1])
