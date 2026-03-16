from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    bookings = relationship("Booking", back_populates="owner", cascade="all, delete-orphan")
    finances = relationship("Finance", back_populates="owner", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="owner", cascade="all, delete-orphan")
    equipment = relationship("Equipment", back_populates="owner", cascade="all, delete-orphan")
    damage_reports = relationship("DamageReport", back_populates="owner", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client = Column(String(120), nullable=False)
    event_type = Column(String(100), nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False)
    venue = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="bookings")


class Finance(Base):
    __tablename__ = "finances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    entry_type = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    entry_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="finances")


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client = Column(String(120), nullable=False)
    event_type = Column(String(100), nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(60), nullable=False, default="draft")
    items = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="quotations")


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    category = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    condition = Column(String(50), nullable=False, default="good")
    availability_status = Column(String(50), nullable=False, default="available")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="equipment")
    damage_reports = relationship("DamageReport", back_populates="equipment", cascade="all, delete-orphan")


class DamageReport(Base):
    __tablename__ = "damage_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    client = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    date_reported = Column(DateTime(timezone=True), nullable=False)
    repair_cost = Column(Float, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="pending_repair")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="damage_reports")
    equipment = relationship("Equipment", back_populates="damage_reports")
