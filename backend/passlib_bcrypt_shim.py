"""Temporary shim so passlib can discover bcrypt version."""

import bcrypt

if not hasattr(bcrypt, "__about__"):
    class _About:  # pragma: no cover - tiny compatibility shim
        __slots__ = ("__version__",)

        def __init__(self, version: str) -> None:
            self.__version__ = version

    setattr(_About, "__module__", bcrypt.__name__)
    setattr(bcrypt, "__about__", _About(getattr(bcrypt, "__version__", "0.0.0")))
