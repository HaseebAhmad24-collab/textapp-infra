from django.urls import path
from .views import insert_text, list_text, delete_text

urlpatterns = [
    path('insert-text/', insert_text, name='insert-text'),
    path('list-text/', list_text, name='list-text'),
    path('delete-text/<int:pk>/', delete_text, name='delete-text'),
]