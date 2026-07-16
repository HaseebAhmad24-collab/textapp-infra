from django.db import models

class TextEntry(models.Model):
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)  # date & time auto-append hoga yahan

    class Meta:
        ordering = ['-created_at']  # latest entry sabse upar

    def __str__(self):
        return f"{self.content[:30]} - {self.created_at}"