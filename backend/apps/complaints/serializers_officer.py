from rest_framework import serializers
from .models import OfficerAssignment, ComplaintEvidence, EscalationHistory, OfficerPerformance

from .serializers import ComplaintSerializer

class OfficerAssignmentSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    complaint_number = serializers.CharField(source='complaint.complaint_number', read_only=True)
    complaint_detail = ComplaintSerializer(source='complaint', read_only=True)

    class Meta:
        model = OfficerAssignment
        fields = '__all__'

class ComplaintEvidenceSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = ComplaintEvidence
        fields = '__all__'

class EscalationHistorySerializer(serializers.ModelSerializer):
    escalated_by_name = serializers.CharField(source='escalated_by.full_name', read_only=True)
    prev_dept_name = serializers.CharField(source='previous_department.department_name', read_only=True)
    new_dept_name = serializers.CharField(source='new_department.department_name', read_only=True)

    class Meta:
        model = EscalationHistory
        fields = '__all__'

class OfficerPerformanceSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)

    class Meta:
        model = OfficerPerformance
        fields = '__all__'
