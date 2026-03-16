import os
from typing import Optional, Tuple

from fastapi import HTTPException
from pydantic import EmailStr
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import asyncio

GMAIL_SMTP_USER = os.getenv("GMAIL_SMTP_USER", "arjohn818@gmail.com")
GMAIL_SMTP_PASSWORD = os.getenv("GMAIL_SMTP_PASSWORD")
MAIL_FROM_NAME_DEFAULT: str = "Event Business Tracker"


async def send_quotation_email(
    recipient: EmailStr,
    subject: str,
    body: str,
    attachment: Optional[Tuple[str, bytes]] = None,
) -> None:
    if not GMAIL_SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="Email service is not configured - missing GMAIL_SMTP_PASSWORD")

    loop = asyncio.get_event_loop()
    
    try:
        await loop.run_in_executor(None, _send_email_sync, recipient, subject, body, attachment)
    except Exception as e:
        import traceback
        print(f"ERROR: Failed to send email: {str(e)}")
        print(f"TRACE: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


def _send_email_sync(
    recipient: str,
    subject: str,
    body: str,
    attachment: Optional[Tuple[str, bytes]] = None,
) -> None:
    msg = MIMEMultipart()
    msg["From"] = f"{MAIL_FROM_NAME_DEFAULT} <{GMAIL_SMTP_USER}>"
    msg["To"] = recipient
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "html"))

    if attachment:
        filename, content = attachment
        part = MIMEBase("application", "octet-stream")
        part.set_payload(content)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f"attachment; filename={filename}")
        msg.attach(part)

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_SMTP_USER, GMAIL_SMTP_PASSWORD)
        server.send_message(msg)

    print(f"DEBUG: Email sent successfully to {recipient}")
