import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel

User = get_user_model()

class Department(BaseModel):
    department_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    department_email = models.EmailField(blank=True, null=True)
    department_phone = models.CharField(max_length=20, blank=True, null=True)
    department_logo = models.URLField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.department_name

class ComplaintCategory(BaseModel):
    category_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=7, default='#3b82f6')
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='categories')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.category_name

class ComplaintStatus(BaseModel):
    status = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#3b82f6')
    sequence = models.IntegerField(default=0, help_text="Ordering sequence in workflow")

    def __str__(self):
        return self.status

class Priority(BaseModel):
    priority = models.CharField(max_length=50, unique=True)
    weight = models.IntegerField(default=0)
    color = models.CharField(max_length=7, default='#3b82f6')

    def __str__(self):
        return self.priority

class Severity(BaseModel):
    severity = models.CharField(max_length=50, unique=True)
    weight = models.IntegerField(default=0)

    def __str__(self):
        return self.severity

class Complaint(BaseModel):
    complaint_number = models.CharField(max_length=50, unique=True, db_index=True)
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    category = models.ForeignKey(ComplaintCategory, on_delete=models.PROTECT, related_name='complaints')
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='complaints', null=True, blank=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    priority = models.ForeignKey(Priority, on_delete=models.PROTECT, related_name='complaints', null=True, blank=True)
    severity = models.ForeignKey(Severity, on_delete=models.PROTECT, related_name='complaints', null=True, blank=True)
    status = models.ForeignKey(ComplaintStatus, on_delete=models.PROTECT, related_name='complaints')
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    
    # AI Analysis Fields (Legacy caching)
    ai_summary = models.TextField(null=True, blank=True)
    ai_category = models.CharField(max_length=100, null=True, blank=True)
    ai_confidence = models.FloatField(null=True, blank=True)
    
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.complaint_number} - {self.title}"

class ComplaintImage(BaseModel):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500)
    is_resolution = models.BooleanField(default=False, help_text="True if uploaded during resolution phase")

    def __str__(self):
        return f"Image for {self.complaint.complaint_number}"

class ComplaintTimeline(BaseModel):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='timeline')
    status_name = models.CharField(max_length=50)
    notes = models.TextField(blank=True, null=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Timeline {self.status_name} for {self.complaint.complaint_number}"

class ComplaintFeedback(BaseModel):
    complaint = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name='feedback')
    rating = models.IntegerField(help_text="1 to 5 stars rating")
    comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Feedback ({self.rating} stars) for {self.complaint.complaint_number}"

# --- AI ENGINE MODELS ---

class AIAnalysis(BaseModel):
    complaint = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name='ai_analysis')
    predicted_category = models.CharField(max_length=100, blank=True, null=True)
    predicted_priority = models.CharField(max_length=50, blank=True, null=True)
    predicted_severity = models.CharField(max_length=50, blank=True, null=True)
    predicted_department = models.CharField(max_length=100, blank=True, null=True)
    
    short_summary = models.TextField(blank=True, null=True)
    detailed_summary = models.TextField(blank=True, null=True)
    officer_summary = models.TextField(blank=True, null=True)
    citizen_summary = models.TextField(blank=True, null=True)
    
    confidence_score = models.FloatField(default=0.0)
    execution_time = models.FloatField(default=0.0)
    status = models.CharField(max_length=50, default='Success')
    explanation = models.TextField(blank=True, null=True)
    sentiment = models.CharField(max_length=50, default='Neutral')

    def __str__(self):
        return f"AI Analysis for {self.complaint.complaint_number}"

class AIRequestLog(BaseModel):
    endpoint = models.CharField(max_length=255)
    request_payload = models.TextField(blank=True, null=True)
    response_payload = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50)
    execution_time = models.FloatField(default=0.0)

    def __str__(self):
        return f"AI Log {self.endpoint}"

class AIPromptHistory(BaseModel):
    prompt_name = models.CharField(max_length=100, unique=True)
    template = models.TextField()

    def __str__(self):
        return self.prompt_name

class AIFeedback(BaseModel):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='ai_feedbacks')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    feedback_type = models.CharField(max_length=20)
    predicted_field = models.CharField(max_length=50)
    corrected_value = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Feedback {self.feedback_type}"

# --- OFFICER OPERATIONS MODELS ---

class OfficerAssignment(BaseModel):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='assignments')
    officer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments')
    status = models.CharField(max_length=50, default='Assigned')
    assigned_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Assignment {self.complaint.complaint_number} to {self.officer.full_name}"

class ComplaintEvidence(BaseModel):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='evidence')
    image_url = models.URLField(max_length=500)
    evidence_type = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"Evidence ({self.evidence_type}) for {self.complaint.complaint_number}"

class EscalationHistory(BaseModel):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='escalations')
    escalated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    previous_department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='escalations_from')
    new_department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='escalations_to')
    reason = models.TextField()

    def __str__(self):
        return f"Escalation of {self.complaint.complaint_number} to {self.new_department.department_name}"

class OfficerPerformance(BaseModel):
    officer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='performance')
    completed_complaints = models.IntegerField(default=0)
    average_resolution_time = models.FloatField(default=0.0)
    rating_average = models.FloatField(default=0.0)
    performance_score = models.FloatField(default=0.0)

    def __str__(self):
        return f"Performance of {self.officer.full_name}"

# --- NEW NOTIFICATION & COMMUNICATION MODELS ---

class Notification(BaseModel):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=100) # Complaint Submitted, Status Update, Broadcast
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.recipient.email} - {self.title}"

class NotificationPreference(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preference')
    email_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    complaint_updates = models.BooleanField(default=True)
    announcements = models.BooleanField(default=True)

    def __str__(self):
        return f"Preferences for {self.user.email}"

class Announcement(BaseModel):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_announcements')
    title = models.CharField(max_length=255)
    content = models.TextField()
    target_role = models.CharField(max_length=50, default='all') # citizen / officer / admin / all

    def __str__(self):
        return self.title
