from rest_framework import serializers

from api.models import Member, Message


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""
    username = serializers.CharField(min_length=3, max_length=150)
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_username(self, value):
        """Check if username is already taken."""
        if Member.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class MemberSerializer(serializers.ModelSerializer):
    """Serializer for Member model (user profile)."""

    class Meta:
        model = Member
        fields = ['id', 'username']
        read_only_fields = ['id']


class AuthorSerializer(serializers.ModelSerializer):
    """Nested serializer for message author."""

    class Meta:
        model = Member
        fields = ['id', 'username']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    author = AuthorSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'content', 'author', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class MessageCreateSerializer(serializers.Serializer):
    """Serializer for creating a new message."""
    content = serializers.CharField(min_length=1, max_length=5000)
