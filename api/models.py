import secrets

from django.contrib.auth.hashers import check_password, make_password
from django.db import models


class Member(models.Model):
    """
    Custom user model for the chat application.
    """
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'members'
        ordering = ['-created_at']

    def __str__(self):
        return self.username

    def set_password(self, raw_password):
        """Hash and set the password."""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if the provided password matches the stored hash."""
        return check_password(raw_password, self.password)

    @property
    def is_authenticated(self):
        """Always return True for authenticated users."""
        return True

    @property
    def is_anonymous(self):
        """Always return False for authenticated users."""
        return False

    def has_perm(self, perm, obj=None):
        """Return True for permission checks (simplified)."""
        return True

    def has_module_perms(self, app_label):
        """Return True for module permission checks (simplified)."""
        return True


class Token(models.Model):
    """
    Token model for authentication.
    """
    key = models.CharField(max_length=64, unique=True, primary_key=True)
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='tokens'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tokens'

    def __str__(self):
        return f"Token for {self.member.username}"

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.generate_key()
        super().save(*args, **kwargs)

    @classmethod
    def generate_key(cls):
        """Generate a random token key."""
        return secrets.token_hex(32)


class Message(models.Model):
    """
    Message model for the group chat.
    """
    author = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField(max_length=5000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['-created_at']

    def __str__(self):
        return f"Message by {self.author.username} at {self.created_at}"
