from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import TextEntry
from .serializers import TextEntrySerializer


@api_view(['POST'])
def insert_text(request):
    serializer = TextEntrySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()  # created_at yahan auto set hoga
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_text(request):
    entries = TextEntry.objects.all()
    serializer = TextEntrySerializer(entries, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
def delete_text(request, pk):
    try:
        entry = TextEntry.objects.get(pk=pk)
    except TextEntry.DoesNotExist:
        return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)
    
    entry.delete()
    return Response({"message": "Deleted successfully"}, status=status.HTTP_200_OK)