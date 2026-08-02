from django.core.management.base import BaseCommand
from apps.complaints.models import Department, ComplaintCategory, ComplaintStatus, Priority, Severity

class Command(BaseCommand):
    help = "Seeds initial Master Data for Departments, Categories, Statuses, Priorities, and Severities."

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding master data...")

        # 1. Seed Departments
        departments_data = [
            {"department_name": "Road Department", "description": "Responsible for roads, potholes, and infrastructure construction."},
            {"department_name": "Water Department", "description": "Responsible for sewage, water lines, pipelines, and supply issues."},
            {"department_name": "Electricity Department", "description": "Responsible for streetlights, grid lines, and power failures."},
            {"department_name": "Sanitation Department", "description": "Responsible for garbage, sewage drainage, and public hygiene."},
            {"department_name": "Traffic Department", "description": "Responsible for traffic blockages, illegal parking, and signs."},
            {"department_name": "Municipality", "description": "General municipality public services and property maintenance."}
        ]

        depts = {}
        for item in departments_data:
            obj, created = Department.objects.get_or_create(
                department_name=item["department_name"],
                defaults={"description": item["description"]}
            )
            depts[item["department_name"]] = obj
            if created:
                self.stdout.write(f"Created Department: {obj.department_name}")

        # 2. Seed Complaint Categories
        categories_data = [
            {"category_name": "Pothole", "description": "Potholes on public roads.", "department": "Road Department", "icon": "Hammer", "color": "#ef4444"},
            {"category_name": "Garbage", "description": "Overflowing public trash bins.", "department": "Sanitation Department", "icon": "Trash2", "color": "#10b981"},
            {"category_name": "Water Leakage", "description": "Water pipe leakages.", "department": "Water Department", "icon": "Droplet", "color": "#3b82f6"},
            {"category_name": "Street Light", "description": "Broken or non-functioning street lights.", "department": "Electricity Department", "icon": "Lightbulb", "color": "#f59e0b"},
            {"category_name": "Drainage", "description": "Clogged sewers or drains.", "department": "Sanitation Department", "icon": "Filter", "color": "#06b6d4"},
            {"category_name": "Illegal Parking", "description": "Vehicles blocking access or walkways.", "department": "Traffic Department", "icon": "Car", "color": "#8b5cf6"},
            {"category_name": "Road Damage", "description": "Cracks or erosion on tar roads.", "department": "Road Department", "icon": "Construction", "color": "#f43f5e"},
            {"category_name": "Electricity", "description": "Power grid line failures.", "department": "Electricity Department", "icon": "Zap", "color": "#eab308"},
            {"category_name": "Public Property Damage", "description": "Vandalism on public benches, signs, etc.", "department": "Municipality", "icon": "AlertTriangle", "color": "#64748b"},
            {"category_name": "Other", "description": "Miscellaneous complaints.", "department": "Municipality", "icon": "HelpCircle", "color": "#94a3b8"}
        ]

        for item in categories_data:
            dept_obj = depts.get(item["department"])
            obj, created = ComplaintCategory.objects.get_or_create(
                category_name=item["category_name"],
                defaults={
                    "description": item["description"],
                    "department": dept_obj,
                    "icon": item["icon"],
                    "color": item["color"]
                }
            )
            if created:
                self.stdout.write(f"Created Category: {obj.category_name}")

        # 3. Seed Complaint Statuses
        statuses_data = [
            {"status": "Pending", "description": "Grievance submitted, awaiting review.", "color": "#64748b", "sequence": 1},
            {"status": "Submitted", "description": "Formally logged and tracked.", "color": "#3b82f6", "sequence": 2},
            {"status": "Assigned", "description": "Assigned to the corresponding department.", "color": "#8b5cf6", "sequence": 3},
            {"status": "Accepted", "description": "Accepted by resolving officer.", "color": "#06b6d4", "sequence": 4},
            {"status": "In Progress", "description": "Work is currently ongoing.", "color": "#eab308", "sequence": 5},
            {"status": "Resolved", "description": "Issue resolved, awaiting citizen verification.", "color": "#10b981", "sequence": 6},
            {"status": "Rejected", "description": "Grievance rejected (e.g. invalid location).", "color": "#ef4444", "sequence": 7},
            {"status": "Closed", "description": "Resolved and verified closed.", "color": "#0f172a", "sequence": 8}
        ]

        for item in statuses_data:
            obj, created = ComplaintStatus.objects.get_or_create(
                status=item["status"],
                defaults={
                    "description": item["description"],
                    "color": item["color"],
                    "sequence": item["sequence"]
                }
            )
            if created:
                self.stdout.write(f"Created Status: {obj.status}")

        # 4. Seed Priorities
        priorities_data = [
            {"priority": "Low", "weight": 1, "color": "#10b981"},
            {"priority": "Medium", "weight": 2, "color": "#f59e0b"},
            {"priority": "High", "weight": 3, "color": "#ef4444"},
            {"priority": "Critical", "weight": 4, "color": "#7f1d1d"}
        ]

        for item in priorities_data:
            obj, created = Priority.objects.get_or_create(
                priority=item["priority"],
                defaults={"weight": item["weight"], "color": item["color"]}
            )
            if created:
                self.stdout.write(f"Created Priority: {obj.priority}")

        # 5. Seed Severities
        severities_data = [
            {"severity": "Low", "weight": 1},
            {"severity": "Medium", "weight": 2},
            {"severity": "High", "weight": 3},
            {"severity": "Critical", "weight": 4}
        ]

        for item in severities_data:
            obj, created = Severity.objects.get_or_create(
                severity=item["severity"],
                defaults={"weight": item["weight"]}
            )
            if created:
                self.stdout.write(f"Created Severity: {obj.severity}")

        self.stdout.write(self.style.SUCCESS("Master Data Seeding completed successfully!"))
