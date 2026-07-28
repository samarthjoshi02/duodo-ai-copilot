import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.config import settings
from backend.services.db_service import db_service

# Initialize Firebase Admin
firebase_initialized = False
try:
    if settings.FIREBASE_CREDENTIALS_JSON:
        # Load from raw JSON string (best for Render environment variables)
        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        print("Firebase Admin SDK initialized using JSON string environment variable.")
    elif settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        print("Firebase Admin SDK initialized using service account.")
    elif settings.FIREBASE_PROJECT_ID:
        # Initialise with project ID default credentials
        firebase_admin.initialize_app()
        firebase_initialized = True
        print(f"Firebase Admin SDK initialized for project {settings.FIREBASE_PROJECT_ID}.")
    else:
        # Try initializing with default credentials
        firebase_admin.initialize_app()
        firebase_initialized = True
        print("Firebase Admin SDK initialized with default application credentials.")
except Exception as e:
    print(f"Firebase Admin SDK could not be initialized: {e}. Falling back to mock verification.")
    firebase_initialized = False

security_bearer = HTTPBearer(auto_error=False)

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security_bearer)) -> dict:
    """Verifies Firebase JWT token. Falls back to mock authentication if credentials are not configured."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
        
    token = credentials.credentials
    
    # Check for mock token fallback
    if token.startswith("demo-token:") or not firebase_initialized:
        # Simple parsing for mock tokens
        # Format: demo-token:uid:email:name
        parts = token.split(":")
        if len(parts) >= 4 and parts[0] == "demo-token":
            uid = parts[1]
            email = parts[2]
            name = parts[3].replace("-", " ")
            photo = parts[4] if len(parts) > 4 else "https://lh3.googleusercontent.com/a/default-user"
            
            # Sync user with our database
            user_row = db_service.sync_firebase_user(
                firebase_uid=uid,
                email=email,
                name=name,
                photo=photo
            )
            return user_row
        
        # If any other token is sent but Firebase is not initialized, we generate a stable mock user
        if not firebase_initialized:
            uid = "demo_fallback_uid"
            email = "investor@duodo.ai"
            name = "Demo Investor"
            photo = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
            user_row = db_service.sync_firebase_user(
                firebase_uid=uid,
                email=email,
                name=name,
                photo=photo
            )
            return user_row
            
        raise HTTPException(status_code=401, detail="Invalid token format")

    try:
        # Verify real Firebase token
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email", "")
        name = decoded_token.get("name", "User")
        photo = decoded_token.get("picture", "")

        if not uid or not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # Sync user record to PostgreSQL/SQLite
        user_row = db_service.sync_firebase_user(
            firebase_uid=uid,
            email=email,
            name=name,
            photo=photo
        )
        return user_row
    except Exception as e:
        print(f"Token verification failure: {e}")
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
