"""
Script to create a test user in the database.
Run this once to create the default user with id=1.
"""
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.crop import Crop
from app.models.community_post import CommunityPost
from app.models.community_comment import CommunityComment

def create_test_user():
    """Create a test user with id=1 if it doesn't exist."""
    db = SessionLocal()
    try:
        # Check if user with id=1 already exists
        existing_user = db.query(User).filter(User.id == 1).first()
        
        if existing_user:
            print(f"✓ User already exists: {existing_user.full_name} (id={existing_user.id})")
            return
        
        # Create a new test user
        test_user = User(
            full_name="Test Farmer",
            phone="1234567890",
            location="Test Location"
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✓ Created test user successfully!")
        print(f"  ID: {test_user.id}")
        print(f"  Name: {test_user.full_name}")
        print(f"  Phone: {test_user.phone}")
        
    except Exception as e:
        print(f"✗ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating test user...")
    create_test_user()
