from rest_framework import authentication
from rest_framework import exceptions

from api.models import Token


class TokenAuthentication(authentication.BaseAuthentication):
    """
    Custom token authentication.
    
    Clients should authenticate by passing the token key in the 'Authorization'
    HTTP header, prepended with the string 'Token '. For example:
    
        Authorization: Token 401f7ac837da42b97f613d789819ff93537bee6a
    """
    keyword = 'Token'

    def authenticate(self, request):
        """Authenticate the request and return a tuple of (user, token)."""
        auth_header = authentication.get_authorization_header(request)
        
        if not auth_header:
            return None

        auth_header = auth_header.decode('utf-8')
        
        parts = auth_header.split()

        if len(parts) == 0:
            return None

        if parts[0] != self.keyword:
            return None

        if len(parts) == 1:
            raise exceptions.AuthenticationFailed(
                'Invalid token header. No credentials provided.'
            )
        elif len(parts) > 2:
            raise exceptions.AuthenticationFailed(
                'Invalid token header. Token string should not contain spaces.'
            )

        token_key = parts[1]

        return self.authenticate_credentials(token_key)

    def authenticate_credentials(self, key):
        """Validate the token and return the associated user."""
        try:
            token = Token.objects.select_related('member').get(key=key)
        except Token.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid token.')

        return (token.member, token)

    def authenticate_header(self, request):
        """Return a string to be used as the value of the WWW-Authenticate header."""
        return self.keyword
