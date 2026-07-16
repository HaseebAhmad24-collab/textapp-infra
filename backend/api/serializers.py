from rest_framework import serializers
from .models import TextEntry

class TextEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TextEntry
        fields = ['id', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']