from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.pagination import LimitOffsetPagination

from api.models import Member, Token, Message
from api.serializers import (
    RegisterSerializer,
    LoginSerializer,
    MemberSerializer,
    MessageSerializer,
    MessageCreateSerializer,
)
from api.authentication import TokenAuthentication


class RegisterView(APIView):
    """
    Register a new user.
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create member with hashed password
        member = Member(
            username=serializer.validated_data['username']
        )
        member.set_password(serializer.validated_data['password'])
        member.save()

        # Create token for the new user
        token = Token.objects.create(member=member)

        return Response(
            {
                'id': member.id,
                'username': member.username,
                'token': token.key,
            },
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """
    Authenticate user and return token.
    POST /api/auth/login/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        # Find member by username
        try:
            member = Member.objects.get(username=username)
        except Member.DoesNotExist:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check password
        if not member.check_password(password):
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete old tokens and create new one
        Token.objects.filter(member=member).delete()
        token = Token.objects.create(member=member)

        return Response(
            {
                'id': member.id,
                'username': member.username,
                'token': token.key,
            },
            status=status.HTTP_200_OK
        )


class LogoutView(APIView):
    """
    Logout user by deleting their token.
    POST /api/auth/logout/
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete the current token
        if hasattr(request, 'auth') and request.auth:
            request.auth.delete()

        return Response(
            {'detail': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )


class ProfileView(APIView):
    """
    Get or update current user profile.
    GET /api/profile/
    PUT /api/profile/
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MemberSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = MemberSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check if username is being changed and if it's already taken
        new_username = serializer.validated_data.get('username')
        if new_username and new_username != request.user.username:
            if Member.objects.filter(username=new_username).exclude(id=request.user.id).exists():
                return Response(
                    {'username': ['Username already exists.']},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class MessagePagination(LimitOffsetPagination):
    """Custom pagination for messages."""
    default_limit = 50
    max_limit = 100


class MessageListCreateView(APIView):
    """
    List messages or create a new message.
    GET /api/messages/
    POST /api/messages/
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all messages ordered by created_at descending
        messages = Message.objects.select_related('author').all()

        # Apply pagination
        paginator = MessagePagination()
        paginated_messages = paginator.paginate_queryset(messages, request)

        serializer = MessageSerializer(paginated_messages, many=True)

        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = MessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create message with current user as author
        message = Message.objects.create(
            author=request.user,
            content=serializer.validated_data['content']
        )

        response_serializer = MessageSerializer(message)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
