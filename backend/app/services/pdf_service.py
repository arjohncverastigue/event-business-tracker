from io import BytesIO
from typing import Iterable

from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas

from app.models.user import Finance, Quotation


def build_quotation_pdf(quotation: Quotation) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=LETTER)
    width, height = LETTER

    y = height - 72
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(72, y, f"Quotation for {quotation.client}")
    pdf.setFont("Helvetica", 12)
    y -= 24
    pdf.drawString(72, y, f"Event: {quotation.event_type}")
    y -= 18
    pdf.drawString(72, y, f"Event Date: {quotation.event_date.strftime('%Y-%m-%d %H:%M')}")
    y -= 18
    pdf.drawString(72, y, f"Status: {quotation.status.title()}")

    y -= 36
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(72, y, "Line Items")
    pdf.setFont("Helvetica", 11)
    y -= 24

    total = 0.0
    for item in quotation.items:
        if y < 72:
            pdf.showPage()
            y = height - 72
        description = item.get("description", "")
        quantity = item.get("quantity", 0)
        unit_price = float(item.get("unit_price", 0))
        line_total = quantity * unit_price
        total += line_total
        pdf.drawString(72, y, f"- {description}")
        pdf.drawRightString(width - 72, y, f"Qty {quantity} x ${unit_price:,.2f} = ${line_total:,.2f}")
        y -= 18

    y -= 24
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawRightString(width - 72, y, f"Total: ${total:,.2f}")
    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.read()


def build_finance_report_pdf(finances: Iterable[Finance]) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=LETTER)
    width, height = LETTER
    y = height - 72
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(72, y, "Finance Summary")
    y -= 24
    pdf.setFont("Helvetica", 12)

    income = 0.0
    expense = 0.0
    for record in finances:
        if record.entry_type == "income":
            income += float(record.amount)
        else:
            expense += float(record.amount)

    pdf.drawString(72, y, f"Income: ${income:,.2f}")
    y -= 18
    pdf.drawString(72, y, f"Expenses: ${expense:,.2f}")
    y -= 18
    pdf.drawString(72, y, f"Net: ${(income - expense):,.2f}")
    y -= 30

    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(72, y, "Entries")
    pdf.setFont("Helvetica", 11)
    y -= 24

    for record in finances:
        if y < 72:
            pdf.showPage()
            y = height - 72
        pdf.drawString(72, y, f"- {record.entry_type.title()} | {record.description}")
        pdf.drawRightString(
            width - 72,
            y,
            f"${float(record.amount):,.2f} on {record.entry_date.strftime('%Y-%m-%d')}"
        )
        y -= 18

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.read()
