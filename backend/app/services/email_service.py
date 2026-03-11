import os
from typing import Optional, Tuple

from fastapi import HTTPException
from pydantic import EmailStr

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")


async def send_quotation_email(
    recipient: EmailStr,
    subject: str,
    body: str,
    attachment: Optional[Tuple[str, bytes]] = None,
) -> None:
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        raise HTTPException(status_code=500, detail="Email service is not configured")

    try:
        from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
    except ImportError:
        raise HTTPException(status_code=500, detail="Email service not available - please install fastapi-mail")

    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=os.getenv("MAIL_FROM", MAIL_USERNAME),
        MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Event Business Tracker"),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
        MAIL_SSL_TLS=True,
        USE_CREDENTIALS=True,
    )

    fast_mail = FastMail(conf)
    message = MessageSchema(
        subject=subject,
        recipients=[recipient],
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

    await fast_mail.send_message(message)
