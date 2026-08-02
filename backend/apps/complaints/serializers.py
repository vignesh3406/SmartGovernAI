from rest_framework import serializers
from .models import (
    Department,
    ComplaintCategory,
    ComplaintStatus,
    Priority,
    Severity,
    Complaint,
    ComplaintImage,
    ComplaintTimeline,
    ComplaintFeedback
)

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class ComplaintCategorySerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.department_name', read_only=True)

    class Meta:
        model = ComplaintCategory
        fields = '__all__'

class ComplaintStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintStatus
        fields = '__all__'

class PrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = Priority
        fields = '__all__'

class SeveritySerializer(serializers.ModelSerializer):
    class Meta:
        model = Severity
        fields = '__all__'

class ComplaintImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintImage
        fields = ['id', 'image_url', 'is_resolution', 'created_at']

class ComplaintTimelineSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.full_name', read_only=True)

    class Meta:
        model = ComplaintTimeline
        fields = ['id', 'status_name', 'notes', 'performed_by_name', 'created_at']

class ComplaintFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintFeedback
        fields = ['id', 'rating', 'comment', 'created_at']

class ComplaintSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.full_name', read_only=True)
    citizen_email = serializers.CharField(source='citizen.email', read_only=True)
    category_detail = ComplaintCategorySerializer(source='category', read_only=True)
    department_detail = DepartmentSerializer(source='department', read_only=True)
    status_detail = ComplaintStatusSerializer(source='status', read_only=True)
    priority_detail = PrioritySerializer(source='priority', read_only=True)
    severity_detail = SeveritySerializer(source='severity', read_only=True)
    
    images = ComplaintImageSerializer(many=True, read_only=True)
    timeline = ComplaintTimelineSerializer(many=True, read_only=True)
    feedback = ComplaintFeedbackSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = '__all__'

class ComplaintCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    category = serializers.UUIDField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    images = serializers.ListField(child=serializers.URLField(), required=False)
