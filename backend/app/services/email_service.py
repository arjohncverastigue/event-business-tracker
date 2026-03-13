import os
from typing import Optional, Tuple
from io import BytesIO

from fastapi import HTTPException
from pydantic import EmailStr, NameEmail, SecretStr
from starlette.datastructures import UploadFile

MAIL_USERNAME: Optional[str] = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD: SecretStr = SecretStr(os.getenv("MAIL_PASSWORD", ""))


async def send_quotation_email(
    recipient: EmailStr,
    subject: str,
    body: str,
    attachment: Optional[Tuple[str, bytes]] = None,
) -> None:
    if not MAIL_USERNAME or not MAIL_PASSWORD.get_secret_value():
        raise HTTPException(status_code=500, detail="Email service is not configured")

    try:
        from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"Email service not available - please install fastapi-mail: {str(e)}")

    timeout = int(os.getenv("MAIL_TIMEOUT", "30"))
    
    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=os.getenv("MAIL_FROM", "onboarding@resend.dev"),
        MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Event Business Tracker"),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.resend.com"),
        MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        TIMEOUT=timeout,
    )

    fast_mail = FastMail(conf)
    
    attachments_list: list = []
    if attachment:
        filename, content = attachment
        # Create UploadFile object for the attachment
        from io import BytesIO
        from starlette.datastructures import UploadFile
        
        file_content = BytesIO(content)
        upload_file = UploadFile(
            filename=filename,
            file=file_content
        )
        
        # Use UploadFile directly without metadata
        attachments_list = [upload_file]
    
    # Build message dict and create schema
    msg_data = {
        "subject": subject,
        "recipients": [NameEmail(name=str(recipient), email=str(recipient))],
        "body": body,
        "subtype": MessageType.html,
    }
    if attachments_list:
        msg_data["attachments"] = attachments_list
    
    message = MessageSchema(**msg_data)

    try:
        await fast_mail.send_message(message)
    except Exception as e:
        error_msg = str(e)
        if "Timed out connecting" in error_msg:
            raise HTTPException(
                status_code=500, 
                detail="Email service timeout. This is likely a network connectivity issue from the server to Gmail SMTP. Check if your hosting provider (Railway) allows outbound SMTP connections, or consider using a transactional email service like SendGrid, Mailgun, or Resend."
            )
        raise HTTPException(status_code=500, detail=f"Failed to send email: {error_msg}")
