from django.urls import path

from api.views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    MessageListCreateView,
)

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # Profile endpoint
    path('profile/', ProfileView.as_view(), name='profile'),

    # Messages endpoint
    path('messages/', MessageListCreateView.as_view(), name='messages'),
]
