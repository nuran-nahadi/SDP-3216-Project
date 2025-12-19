from app.core.config import settings
from app.schemas.notifications import DailySummary
from datetime import datetime


class EmailService:
    """Email service using Resend"""
    
    @staticmethod
    def _get_resend_client():
        """Get Resend client if configured"""
        if not settings.resend_api_key:
            return None
        
        try:
            import resend
            resend.api_key = settings.resend_api_key
            return resend
        except ImportError:
            print("Resend package not installed. Run: pip install resend")
            return None
    
    @staticmethod
    def _build_email_html(first_name: str, summary: DailySummary, app_url: str) -> str:
        """Build HTML email content"""
        today = datetime.now().strftime("%B %d, %Y")
        
        # Build today's events list
        events_today_html = ""
        if summary.events_upcoming:
            events_today_html = "<ul style='margin: 0; padding-left: 20px;'>"
            for event in summary.events_upcoming:
                events_today_html += f"<li style='margin: 5px 0;'>{event['start_time']} - {event['title']}</li>"
            events_today_html += "</ul>"
        else:
            events_today_html = "<p style='color: #666; margin: 0;'>No events scheduled</p>"
        
        # Build upcoming week events list
        events_week_html = ""
        if summary.events_next_week_list:
            events_week_html = "<ul style='margin: 0; padding-left: 20px;'>"
            for event in summary.events_next_week_list:
                events_week_html += f"<li style='margin: 5px 0;'>{event['start_time']} - {event['title']}</li>"
            events_week_html += "</ul>"
        else:
            events_week_html = "<p style='color: #666; margin: 0;'>No upcoming events</p>"
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f0ff;">
    <div style="background: #e9d5ff; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 3px solid #c084fc;">
        <h1 style="color: #6b21a8; margin: 0; font-size: 28px; font-weight: bold;">LIN</h1>
        <p style="color: #7c3aed; margin: 10px 0 0 0; font-weight: 500;">Your Daily Summary</p>
    </div>
    
    <div style="background: #faf5ff; padding: 30px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 18px; margin-top: 0;">Hi {first_name}!</p>
        <p style="color: #666; margin-bottom: 25px;">Here's your overview for <strong>{today}</strong></p>
        
        <!-- Reminder Section -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); padding: 20px; border-radius: 8px; margin: 0 0 25px 0; text-align: center;">
            <p style="color: white; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">Ready to tackle your day?</p>
            <a href="{app_url}/dashboard" style="display: inline-block; background: white; color: #8b5cf6; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Open LIN App</a>
        </div>
        
        <h2 style="color: #6b21a8; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #e9d5ff; padding-bottom: 8px;">Today's Summary</h2>
        
        <!-- Tasks Section -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <h3 style="margin: 0 0 15px 0; color: #8b5cf6; font-weight: 600;">Tasks</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: #333;">{summary.tasks_pending}</span>
                        <span style="color: #666; display: block; font-size: 14px;">pending</span>
                    </td>
                    <td style="padding: 8px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: #f59e0b;">{summary.tasks_due_today}</span>
                        <span style="color: #666; display: block; font-size: 14px;">due today</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: #ef4444;">{summary.tasks_overdue}</span>
                        <span style="color: #666; display: block; font-size: 14px;">overdue</span>
                    </td>
                    <td style="padding: 8px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: #10b981;">{summary.tasks_completed_today}</span>
                        <span style="color: #666; display: block; font-size: 14px;">completed today</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Events Section -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 15px 0; color: #10b981; font-weight: 600;">Today's Events ({summary.events_today})</h3>
            {events_today_html}
        </div>
        
        <!-- Expenses Section -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 15px 0; color: #f59e0b; font-weight: 600;">Expenses</h3>
            <p style="margin: 5px 0;"><strong>Today:</strong> ${summary.expenses_today:.2f}</p>
            <p style="margin: 5px 0;"><strong>This week:</strong> ${summary.expenses_this_week:.2f}</p>
            {f'<p style="margin: 5px 0; color: #666;">Top category: {summary.top_expense_category}</p>' if summary.top_expense_category else ''}
        </div>
        
        <!-- Upcoming Week Section -->
        <h2 style="color: #6b21a8; font-size: 20px; margin: 35px 0 15px 0; border-bottom: 2px solid #e9d5ff; padding-bottom: 8px;">Next 7 Days</h2>
        
        <!-- Upcoming Tasks -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #8b5cf6;">
            <h3 style="margin: 0 0 10px 0; color: #8b5cf6; font-weight: 600;">Tasks Due</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #8b5cf6;">{summary.tasks_due_next_week}</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">tasks due in the next week</p>
        </div>
        
        <!-- Upcoming Events -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 15px 0; color: #10b981; font-weight: 600;">Upcoming Events ({summary.events_next_week})</h3>
            {events_week_html}
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="text-align: center; color: #666; font-size: 14px;">
            Have a productive day!
        </p>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="{app_url}/notifications" style="color: #8b5cf6; text-decoration: none; font-size: 12px;">Manage notification preferences</a>
        </p>
    </div>
</body>
</html>
"""
        return html
    
    @staticmethod
    def _build_email_text(first_name: str, summary: DailySummary) -> str:
        """Build plain text email content"""
        today = datetime.now().strftime("%B %d, %Y")
        
        events_text = ""
        if summary.events_upcoming:
            for event in summary.events_upcoming:
                events_text += f"  • {event['start_time']} - {event['title']}\n"
        else:
            events_text = "  No events scheduled for today\n"
        
        text = f"""
LIN - Your Daily Summary
{today}

Hi {first_name}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASKS
  • {summary.tasks_pending} pending
  • {summary.tasks_due_today} due today
  • {summary.tasks_overdue} overdue
  • {summary.tasks_completed_today} completed today

TODAY'S EVENTS ({summary.events_today})
{events_text}
EXPENSES
  • Today: ${summary.expenses_today:.2f}
  • This week: ${summary.expenses_this_week:.2f}
  {f'• Top category: {summary.top_expense_category}' if summary.top_expense_category else ''}

JOURNAL
  {'Last entry: ' + str(summary.journal_last_entry_days) + ' days ago' if summary.journal_last_entry_days else 'Start journaling today!'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Have a productive day!

— LIN
"""
        return text
    
    @staticmethod
    async def send_daily_summary_email(
        to_email: str,
        first_name: str,
        summary: DailySummary
    ) -> bool:
        """Send daily summary email to user"""
        resend = EmailService._get_resend_client()
        
        if not resend:
            print("Resend not configured. Email not sent.")
            return False
        
        try:
            today = datetime.now().strftime("%b %d")
            subject = f"Your LIN Daily Summary - {today}"
            
            html_content = EmailService._build_email_html(first_name, summary, settings.frontend_url)
            
            params = {
                "from": settings.resend_from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            
            response = resend.Emails.send(params)
            
            if response and response.get("id"):
                print(f"Email sent successfully to {to_email}, ID: {response['id']}")
                return True
            else:
                print(f"Failed to send email: {response}")
                return False
                
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
