import os
from supabase import create_client, Client

# Use absolute URL from .env.local
env_path = r"C:\Users\RENE\OneDrive - renebreton.mx\PROYECTO_SAAS_SEGUROS\portal\.env.local"
supabase_url = ""
supabase_key = ""

if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
                supabase_url = line.split('=')[1].strip()
            if line.startswith('NEXT_PUBLIC_SUPABASE_ANON_KEY='):
                supabase_key = line.split('=')[1].strip()

if not supabase_url or not supabase_key:
    print("Error: Could not find Supabase credentials in .env.local")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

try:
    # Check policies table size
    policies = supabase.table('policies').select('id', count='exact').limit(1).execute()
    print(f"Total Policies: {policies.count}")

    # Check policy_documents table
    docs = supabase.table('policy_documents').select('*').limit(10).execute()
    print(f"Policy Documents found: {len(docs.data)}")
    for doc in docs.data:
        print(f" - ID: {doc['id']}, Type: {doc['document_type']}, URL: {doc['file_url']}")

except Exception as e:
    print(f"Error querying Supabase: {e}")
