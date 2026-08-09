from apps.accounts.models import User, Role

email = "admin@example.com"
password = "adminpassword123"
full_name = "Admin User"

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, full_name=full_name, password=password)
    print(f"Superuser created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")
else:
    print(f"Superuser {email} already exists.")
