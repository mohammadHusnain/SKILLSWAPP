"""
Django management command to create MongoDB indexes for SkillSwap.
"""

from django.core.management.base import BaseCommand
from api.db import create_indexes


class Command(BaseCommand):
    help = 'Create MongoDB indexes for optimal performance'

    def handle(self, *args, **options):
        try:
            create_indexes()
            self.stdout.write(
                self.style.SUCCESS('Successfully created MongoDB indexes')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create indexes: {e}')
            )
