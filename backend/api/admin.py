from django.contrib import admin
from .models import TextEntry

@admin.register(TextEntry)
class TextEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'content', 'created_at')