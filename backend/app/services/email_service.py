import os
from typing import Optional, Tuple

from fastapi import HTTPException
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM", MAIL_USERNAME or "noreply@example.com")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Event Business Tracker")
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))

conf: Optional[ConnectionConfig] = None
if MAIL_USERNAME and MAIL_PASSWORD:
    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=MAIL_FROM,
        MAIL_FROM_NAME=MAIL_FROM_NAME,
        MAIL_SERVER=MAIL_SERVER,
        MAIL_PORT=MAIL_PORT,
        MAIL_SSL_TLS=True,
        USE_CREDENTIALS=True,
    )


async def send_quotation_email(
    recipient: EmailStr,
    subject: str,
    body: str,
    attachment: Optional[Tuple[str, bytes]] = None,
) -> None:
    if conf is None:
        raise HTTPException(status_code=500, detail="Email service is not configured")

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
