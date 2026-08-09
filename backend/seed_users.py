import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User, Role

def seed():
    # Define roles
    admin_role, _ = Role.objects.get_or_create(role_name='admin')
    citizen_role, _ = Role.objects.get_or_create(role_name='citizen')
    officer_role, _ = Role.objects.get_or_create(role_name='officer')

    users_to_create = [
        {
            'email': 'admin@example.com',
            'password': 'adminpassword123',
            'full_name': 'System Admin',
            'role': admin_role,
            'is_superuser': True,
            'is_staff': True
        },
        {
            'email': 'citizen@example.com',
            'password': 'citizenpassword123',
            'full_name': 'John Citizen',
            'role': citizen_role,
            'is_superuser': False,
            'is_staff': False
        },
        {
            'email': 'road@example.com',
            'password': 'roadpassword123',
            'full_name': 'Road Dept Officer',
            'role': officer_role,
            'is_superuser': False,
            'is_staff': True
        },
        {
            'email': 'water@example.com',
            'password': 'waterpassword123',
            'full_name': 'Water Dept Officer',
            'role': officer_role,
            'is_superuser': False,
            'is_staff': True
        },
        {
            'email': 'electricity@example.com',
            'password': 'electricitypassword123',
            'full_name': 'Electricity Dept Officer',
            'role': officer_role,
            'is_superuser': False,
            'is_staff': True
        },
        {
            'email': 'sanitation@example.com',
            'password': 'sanitationpassword123',
            'full_name': 'Sanitation Dept Officer',
            'role': officer_role,
            'is_superuser': False,
            'is_staff': True
        },
        {
            'email': 'traffic@example.com',
            'password': 'trafficpassword123',
            'full_name': 'Traffic Dept Officer',
            'role': officer_role,
            'is_superuser': False,
            'is_staff': True
        },
        {
            'email': 'municipality@example.com',
            'password': 'municipalitypassword123',
            'full_name': 'Municipality Officer',
            'role': officer_role,
            'is_superuser': False,
            'is_staff': True
        }
    ]

    for user_data in users_to_create:
        email = user_data['email']
        if not User.objects.filter(email=email).exists():
            user = User.objects.create_user(
                email=email,
                full_name=user_data['full_name'],
                password=user_data['password'],
                role=user_data['role']
            )
            # Make sure to set flags for admin if needed
            if user_data['is_superuser']:
                user.is_superuser = True
                user.is_staff = True
            elif user_data['is_staff']:
                user.is_staff = True
            
            user.is_verified = True  # Auto-verify them for testing
            user.save()
            print(f"✅ Created {user_data['role'].role_name}: {email} / {user_data['password']}")
        else:
            print(f"⚠️ User {email} already exists.")

if __name__ == '__main__':
    print("Starting database seeding...")
    seed()
    print("Seeding complete!")
