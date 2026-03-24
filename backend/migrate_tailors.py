"""
Database migration script to add missing columns to tailors table
Run this script to update the database schema
"""

import sqlite3
import sys

def migrate_tailors_table():
    """Add missing columns to tailors table"""
    
    # Connect to database
    conn = sqlite3.connect('fashion_fusion.db')
    cursor = conn.cursor()
    
    try:
        # Check if business_type column exists
        cursor.execute("PRAGMA table_info(tailors)")
        columns = [row[1] for row in cursor.fetchall()]
        
        print("Current columns in tailors table:", columns)
        
        # Add missing columns
        if 'business_type' not in columns:
            print("Adding business_type column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN business_type VARCHAR(50) DEFAULT 'tailor'")
        
        if 'specialties' not in columns:
            print("Adding specialties column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN specialties TEXT DEFAULT '[]'")
        
        if 'services_offered' not in columns:
            print("Adding services_offered column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN services_offered TEXT")
        
        if 'price_range_min' not in columns:
            print("Adding price_range_min column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN price_range_min REAL")
        
        if 'price_range_max' not in columns:
            print("Adding price_range_max column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN price_range_max REAL")
        
        if 'portfolio_images' not in columns:
            print("Adding portfolio_images column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN portfolio_images TEXT")
        
        if 'service_radius_km' not in columns:
            print("Adding service_radius_km column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN service_radius_km INTEGER DEFAULT 50")
        
        if 'is_verified' not in columns:
            print("Adding is_verified column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN is_verified BOOLEAN DEFAULT 0")
        
        if 'is_active' not in columns:
            print("Adding is_active column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN is_active BOOLEAN DEFAULT 1")
        
        if 'total_reviews' not in columns:
            print("Adding total_reviews column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN total_reviews INTEGER DEFAULT 0")
        
        if 'total_orders' not in columns:
            print("Adding total_orders column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN total_orders INTEGER DEFAULT 0")
        
        if 'completed_orders' not in columns:
            print("Adding completed_orders column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN completed_orders INTEGER DEFAULT 0")
        
        if 'average_response_time' not in columns:
            print("Adding average_response_time column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN average_response_time REAL DEFAULT 0.0")
        
        if 'created_at' not in columns:
            print("Adding created_at column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
        
        if 'updated_at' not in columns:
            print("Adding updated_at column...")
            cursor.execute("ALTER TABLE tailors ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
        # Show updated columns
        cursor.execute("PRAGMA table_info(tailors)")
        updated_columns = [row[1] for row in cursor.fetchall()]
        print("Updated columns in tailors table:", updated_columns)
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()
    
    return True

if __name__ == "__main__":
    migrate_tailors_table()
