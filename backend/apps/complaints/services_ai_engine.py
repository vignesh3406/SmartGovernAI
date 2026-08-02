import os
import json
import time
import logging
import requests
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from .models import AIAnalysis, AIRequestLog, AIPromptHistory, Complaint

logger = logging.getLogger(__name__)

class AIEngineService:
    @staticmethod
    def get_prompt_template() -> str:
        """
        Retrieves or initializes the prompt template.
        """
        prompt_name = "complaint_analysis_template"
        default_template = """
        You are an AI assistant processing public civic grievances.
        Analyze the provided complaint title, description, and images (if any).
        
        Return a JSON response with the following exact keys:
        - predicted_category: One of Pothole, Garbage, Water Leakage, Street Light, Drainage, Illegal Parking, Road Damage, Electricity, Public Property Damage, Other.
        - predicted_priority: One of Low, Medium, High, Critical.
        - predicted_severity: One of Low, Medium, High, Critical.
        - predicted_department: One of Road Department, Water Department, Electricity Department, Sanitation Department, Traffic Department, Municipality.
        
        - short_summary: A 1-sentence summary of the grievance.
        - detailed_summary: A detailed 2-3 sentence summary of the issue.
        - officer_summary: A summary with technical details action items for resolving officers.
        - citizen_summary: A reassuring, customer-focused summary update for the citizen.
        
        - confidence_score: An integer from 0 to 100 representing classification confidence.
        - explanation: Explain the reasoning behind your priority and severity choices.
        - sentiment: One of Neutral, Concerned, Urgent, Emergency.
        """
        
        obj, created = AIPromptHistory.objects.get_or_create(
            prompt_name=prompt_name,
            defaults={"template": default_template}
        )
        return obj.template

    @staticmethod
    def run_complaint_analysis(complaint: Complaint) -> AIAnalysis:
        """
        Orchestrates text + image analysis via Google Gemini, saving results in AIAnalysis & logging execution details.
        """
        start_time = time.time()
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
        prompt_template = AIEngineService.get_prompt_template()
        
        # Assemble request payload representation
        images_info = [img.image_url for img in complaint.images.all()]
        request_payload = {
            "title": complaint.title,
            "description": complaint.description,
            "images": images_info,
            "prompt": prompt_template
        }

        # Initialize mock/fallback status
        status_log = 'Success'
        response_payload = ""

        import sys
        # Check if key is placeholder or missing or running tests
        if not api_key or api_key == 'your-gemini-api-key' or 'test' in sys.argv:
            logger.warning("Gemini API key is not configured or running tests. Falling back to local rule-based AI Engine.")
            ai_data = AIEngineService._local_fallback_analysis(complaint)
            status_log = 'Manual Review' if ai_data["confidence_score"] < 60 else 'Success'
            response_payload = json.dumps(ai_data)
        else:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                
                # Fetch first image if present
                img_data_item = None
                if complaint.images.exists():
                    first_img_url = complaint.images.first().image_url
                    try:
                        resp = requests.get(first_img_url, timeout=5)
                        if resp.status_code == 200:
                            # Map content type
                            content_type = resp.headers.get('content-type', 'image/jpeg')
                            img_data_item = {
                                "mime_type": content_type,
                                "data": resp.content
                            }
                    except Exception:
                        pass
                
                contents = [
                    f"{prompt_template}\n\nTitle: {complaint.title}\nDescription: {complaint.description}"
                ]
                if img_data_item:
                    contents.append(img_data_item)

                # API call with retry
                response = None
                for attempt in range(2):
                    try:
                        response = model.generate_content(
                            contents,
                            generation_config={"response_mime_type": "application/json"}
                        )
                        break
                    except Exception as api_err:
                        if attempt == 1:
                            raise api_err
                        time.sleep(1)

                response_payload = response.text
                result = json.loads(response_payload)
                
                # Parse scores and metrics
                confidence = int(result.get("confidence_score", 80))
                status_log = 'Manual Review' if confidence < 60 else 'Success'

                ai_data = {
                    "predicted_category": result.get("predicted_category", "Other"),
                    "predicted_priority": result.get("predicted_priority", "Low"),
                    "predicted_severity": result.get("predicted_severity", "Low"),
                    "predicted_department": result.get("predicted_department", "Municipality"),
                    "short_summary": result.get("short_summary", complaint.description[:100]),
                    "detailed_summary": result.get("detailed_summary", complaint.description[:200]),
                    "officer_summary": result.get("officer_summary", "Inspect site location for validation."),
                    "citizen_summary": result.get("citizen_summary", "We have received your request and forwarded to department."),
                    "confidence_score": confidence,
                    "explanation": result.get("explanation", "Matches keywords rules."),
                    "sentiment": result.get("sentiment", "Neutral")
                }
            except Exception as e:
                logger.error(f"Gemini API failure: {str(e)}. Using fallback.")
                ai_data = AIEngineService._local_fallback_analysis(complaint)
                status_log = 'Failed'
                response_payload = f"Error: {str(e)}"

        execution_duration = time.time() - start_time
        
        # Save AIRequestLog
        AIRequestLog.objects.create(
            endpoint="/api/ai/analyze/",
            request_payload=json.dumps(request_payload),
            response_payload=response_payload,
            status='Success' if status_log != 'Failed' else 'Error',
            execution_time=execution_duration
        )

        # Save/Update AIAnalysis
        analysis, _ = AIAnalysis.objects.update_or_create(
            complaint=complaint,
            defaults={
                "predicted_category": ai_data["predicted_category"],
                "predicted_priority": ai_data["predicted_priority"],
                "predicted_severity": ai_data["predicted_severity"],
                "predicted_department": ai_data["predicted_department"],
                "short_summary": ai_data["short_summary"],
                "detailed_summary": ai_data["detailed_summary"],
                "officer_summary": ai_data["officer_summary"],
                "citizen_summary": ai_data["citizen_summary"],
                "confidence_score": ai_data["confidence_score"],
                "explanation": ai_data["explanation"],
                "sentiment": ai_data["sentiment"],
                "execution_time": execution_duration,
                "status": status_log
            }
        )

        return analysis

    @staticmethod
    def _local_fallback_analysis(complaint: Complaint) -> dict:
        """
        Mock fallback keywords logic if Gemini fails or is offline.
        """
        text = (complaint.title + " " + complaint.description).lower()
        
        category = "Other"
        department = "Municipality"
        priority = "Low"
        severity = "Low"
        sentiment = "Neutral"
        confidence = 75

        # Check urgency
        if "emergency" in text or "immediate" in text or "danger" in text:
            priority = "Critical"
            severity = "Critical"
            sentiment = "Emergency"
            confidence = 90
        elif "urgent" in text or "asap" in text:
            priority = "High"
            severity = "High"
            sentiment = "Urgent"

        if "pothole" in text or "road" in text:
            category = "Pothole"
            department = "Road Department"
        elif "garbage" in text or "trash" in text:
            category = "Garbage"
            department = "Sanitation Department"
        elif "leak" in text or "water" in text:
            category = "Water Leakage"
            department = "Water Department"
        elif "light" in text or "dark" in text:
            category = "Street Light"
            department = "Electricity Department"

        return {
            "predicted_category": category,
            "predicted_priority": priority,
            "predicted_severity": severity,
            "predicted_department": department,
            "short_summary": f"Reported {complaint.title} in the neighborhood.",
            "detailed_summary": f"Citizen reported: '{complaint.description}'. Location: {complaint.address}",
            "officer_summary": f"Verify reported {category} issue and coordinate resolution.",
            "citizen_summary": f"Your ticket regarding {category} has been received. Our team will resolve it soon.",
            "confidence_score": confidence,
            "explanation": "Processed locally via keyword matcher rules.",
            "sentiment": sentiment
        }
