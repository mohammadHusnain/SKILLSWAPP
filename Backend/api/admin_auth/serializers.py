from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Check if user exists and is actually an admin BEFORE authenticating
            try:
                user = User.objects.get(email=email)
                if not (user.is_superuser and user.is_staff):
                     raise serializers.ValidationError('Invalid credentials', code='authorization')
            except User.DoesNotExist:
                 raise serializers.ValidationError('Invalid credentials', code='authorization')

            user = authenticate(request=self.context.get('request'), username=email, password=password)

            if not user:
                raise serializers.ValidationError('Invalid credentials', code='authorization')
        else:
            raise serializers.ValidationError('Must include "email" and "password".', code='authorization')

        attrs['user'] = user
        return attrs
