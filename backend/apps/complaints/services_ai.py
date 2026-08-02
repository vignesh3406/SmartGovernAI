import os
import json
import logging
from django.conf import settings
from .models import Department, ComplaintCategory, Complaint, ComplaintStatus, Priority, Severity

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def analyze_complaint(title: str, description: str) -> dict:
        """
        Uses Google Gemini to analyze complaint description and returns structured details.
        Falls back to local rule-based keywords parsing if Gemini API key is missing or fails.
        """
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
        
        if not api_key or api_key == 'your-gemini-api-key':
            logger.warning("Gemini API Key not set. Using local rule-based analysis fallback.")
            return AIService._local_analysis_fallback(title, description)

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = f"""
            Analyze the following civic complaint and return a JSON object with exactly these fields:
            - category: Best matching category from: Pothole, Garbage, Water Leakage, Street Light, Drainage, Illegal Parking, Road Damage, Electricity, Public Property Damage, Other.
            - priority: Low, Medium, High, or Critical.
            - severity: Low, Medium, High, or Critical.
            - summary: A concise 1-2 sentence summary of the complaint.
            - department: Best matching department from: Road Department, Water Department, Electricity Department, Sanitation Department, Traffic Department, Municipality.
            - confidence: A confidence score between 0.0 and 1.0.

            Complaint Title: {title}
            Description: {description}
            """
            
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            result = json.loads(response.text)
            return {
                "category": result.get("category", "Other"),
                "priority": result.get("priority", "Low"),
                "severity": result.get("severity", "Low"),
                "summary": result.get("summary", description[:200]),
                "department": result.get("department", "Municipality"),
                "confidence": float(result.get("confidence", 0.75))
            }
        except Exception as e:
            logger.error(f"Gemini API analysis failed: {str(e)}. Falling back to local rules.")
            return AIService._local_analysis_fallback(title, description)

    @staticmethod
    def _local_analysis_fallback(title: str, description: str) -> dict:
        """
        Fallback keyword-based parser when Gemini API is unavailable.
        """
        text = (title + " " + description).lower()
        
        category = "Other"
        department = "Municipality"
        priority = "Low"
        severity = "Low"
        
        if "pothole" in text or "tar road" in text:
            category = "Pothole"
            department = "Road Department"
            priority = "Medium"
            severity = "Medium"
        elif "road" in text or "crack" in text:
            category = "Road Damage"
            department = "Road Department"
            priority = "Medium"
            severity = "Low"
        elif "garbage" in text or "trash" in text or "dump" in text:
            category = "Garbage"
            department = "Sanitation Department"
            priority = "Low"
            severity = "Low"
        elif "leak" in text or "pipe" in text or "water" in text:
            category = "Water Leakage"
            department = "Water Department"
            priority = "Medium"
            severity = "Medium"
        elif "light" in text or "dark" in text or "street light" in text:
            category = "Street Light"
            department = "Electricity Department"
            priority = "Low"
            severity = "Low"
        elif "wire" in text or "current" in text or "shock" in text or "spark" in text:
            category = "Electricity"
            department = "Electricity Department"
            priority = "High"
            severity = "Critical"
        elif "drain" in text or "sewer" in text:
            category = "Drainage"
            department = "Sanitation Department"
            priority = "Medium"
            severity = "High"
        elif "park" in text or "parking" in text or "traffic" in text:
            category = "Illegal Parking"
            department = "Traffic Department"
            priority = "Low"
            severity = "Low"
        elif "damage" in text or "vandal" in text or "bench" in text:
            category = "Public Property Damage"
            department = "Municipality"
            priority = "Low"
            severity = "Medium"

        return {
            "category": category,
            "priority": priority,
            "severity": severity,
            "summary": description[:150] + "..." if len(description) > 150 else description,
            "department": department,
            "confidence": 0.8
        }

    @staticmethod
    def detect_duplicates(latitude, longitude, category_id, threshold_meters=100) -> list:
        """
        Queries database for matching category complaints within bounding box (approx 100 meters).
        Returns matching complaints that are not in Closed/Resolved state.
        """
        if not latitude or not longitude:
            return []

        # 1 degree of latitude is roughly 111,111 meters.
        # Bounding box delta:
        delta = threshold_meters / 111111.0

        lat_min = float(latitude) - delta
        lat_max = float(latitude) + delta
        lon_min = float(longitude) - delta
        lon_max = float(longitude) + delta

        # Filter active complaints (not closed, not resolved, not rejected)
        active_statuses = ["Pending", "Submitted", "Assigned", "Accepted", "In Progress"]
        
        matches = Complaint.objects.filter(
            category_id=category_id,
            latitude__gte=lat_min,
            latitude__lte=lat_max,
            longitude__gte=lon_min,
            longitude__lte=lon_max,
            status__status__in=active_statuses
        ).select_related('status', 'category')
        
        return list(matches)
