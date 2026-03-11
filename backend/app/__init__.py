"""Application package initialization."""

# Ensure ORM models register metadata on import
from . import models  # noqa: F401

# Apply passlib/bcrypt compatibility shim (Windows + bcrypt>=4.1)
import passlib_bcrypt_shim  # noqa: F401,E402
