from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Seeds the database with a superuser admin if none exists'

    def handle(self, *args, **options):
        # Admin credentials from env or defaults
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@skillswap.com')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'AdminSecret123!')
        
        if User.objects.filter(email=admin_email).exists():
            self.stdout.write(self.style.WARNING(f'Admin user {admin_email} already exists.'))
            return

        try:
            # Create superuser
            admin = User.objects.create_superuser(
                username=admin_email,
                email=admin_email,
                password=admin_password
            )
            
            # Ensure staff status is set (superuser usually implies it, but let's be explicit)
            admin.is_staff = True
            admin.save()
            
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin user: {admin_email}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to create admin user: {e}'))
