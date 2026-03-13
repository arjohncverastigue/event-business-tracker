import os
from typing import Optional, Tuple

from fastapi import HTTPException
from pydantic import EmailStr, NameEmail, SecretStr

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

    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=os.getenv("MAIL_FROM", MAIL_USERNAME),
        MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Event Business Tracker"),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
    )

    fast_mail = FastMail(conf)
    message = MessageSchema(
        subject=subject,
        recipients=[NameEmail(name=recipient, email=recipient)],
        body=body,
        subtype=MessageType.html,
    )

    if attachment:
        filename, content = attachment
        message.attachments = [
            {
                "file": content,
                "filename": filename,
                "content_type": "application/pdf",
            }
        ]

    try:
        await fast_mail.send_message(message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
