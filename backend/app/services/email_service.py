import os
from typing import Optional, Tuple

from fastapi import HTTPException
from pydantic import EmailStr
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64
import asyncio

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM", "arjohn818@gmail.com")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Event Business Tracker")


async def send_quotation_email(
    recipient: EmailStr,
    subject: str,
    body: str,
    attachment: Optional[Tuple[str, bytes]] = None,
) -> None:
    if not SENDGRID_API_KEY:
        raise HTTPException(status_code=500, detail="Email service is not configured - missing SENDGRID_API_KEY")

    try:
        message = Mail(
            from_email=MAIL_FROM,
            to_emails=recipient,
            subject=subject,
            html_content=body,
        )

        if attachment:
            filename, content = attachment
            encoded_content = base64.b64encode(content).decode("utf-8")
            message.attachment = Attachment(
                file_content=FileContent(encoded_content),
                file_name=FileName(filename),
                file_type=FileType("application/pdf"),
                disposition=Disposition("attachment")
            )

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _send_email_sync, message)

    except Exception as e:
        import traceback
        print(f"ERROR: Failed to send email: {str(e)}")
        print(f"TRACE: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


def _send_email_sync(message: Mail) -> None:
    sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
    response = sg.send(message)
    print(f"DEBUG: SendGrid response: {response.status_code}")
