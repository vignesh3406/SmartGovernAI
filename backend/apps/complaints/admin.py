from django.contrib import admin
from .models import Department, ComplaintCategory, ComplaintStatus, Priority, Severity

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('department_name', 'department_email', 'department_phone', 'is_active', 'created_at')
    search_fields = ('department_name',)
    list_filter = ('is_active',)

@admin.register(ComplaintCategory)
class ComplaintCategoryAdmin(admin.ModelAdmin):
    list_display = ('category_name', 'department', 'color', 'is_active', 'created_at')
    search_fields = ('category_name', 'department__department_name')
    list_filter = ('department', 'is_active')

@admin.register(ComplaintStatus)
class ComplaintStatusAdmin(admin.ModelAdmin):
    list_display = ('status', 'color', 'sequence')
    search_fields = ('status',)
    ordering = ('sequence',)

@admin.register(Priority)
class PriorityAdmin(admin.ModelAdmin):
    list_display = ('priority', 'weight', 'color')
    search_fields = ('priority',)
    ordering = ('-weight',)

@admin.register(Severity)
class SeverityAdmin(admin.ModelAdmin):
    list_display = ('severity', 'weight')
    search_fields = ('severity',)
    ordering = ('-weight',)
