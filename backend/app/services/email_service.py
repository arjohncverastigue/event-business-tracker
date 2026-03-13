import os
from typing import Optional, Tuple

from fastapi import HTTPException
from pydantic import EmailStr

MAIL_RESEND_API_KEY: Optional[str] = os.getenv("MAIL_RESEND_API_KEY")
MAIL_FROM: Optional[str] = os.getenv("MAIL_FROM", "onboarding@resend.dev")
MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Event Business Tracker")


async def send_quotation_email(
    recipient: EmailStr,
    subject: str,
    body: str,
    attachment: Optional[Tuple[str, bytes]] = None,
) -> None:
    print(f"DEBUG: MAIL_RESEND_API_KEY = {MAIL_RESEND_API_KEY}")
    print(f"DEBUG: MAIL_FROM = {MAIL_FROM}")
    print(f"DEBUG: MAIL_FROM_NAME = {MAIL_FROM_NAME}")
    
    if not MAIL_RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email service is not configured - missing MAIL_RESEND_API_KEY")

    try:
        import resend
    except ImportError:
        raise HTTPException(status_code=500, detail="Email service not available - please install resend")

    resend.api_key = MAIL_RESEND_API_KEY

    email_data = {
        "from": f"{MAIL_FROM_NAME} <{MAIL_FROM}>",
        "to": [recipient],
        "subject": subject,
        "html": body,
    }

    if attachment:
        filename, content = attachment
        import base64
        email_data["attachments"] = [
            {
                "filename": filename,
                "content": base64.b64encode(content).decode("utf-8"),
            }
        ]

    try:
        response = resend.Emails.send(email_data)
        print(f"DEBUG: Resend response: {response}")
        return response
    except Exception as e:
        import traceback
        print(f"ERROR: Failed to send email: {str(e)}")
        print(f"TRACE: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
