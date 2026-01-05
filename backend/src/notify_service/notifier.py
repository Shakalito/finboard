from __future__ import annotations

from dataclasses import dataclass
import smtplib
from email.message import EmailMessage
from typing import Protocol

from ..common.config import settings


@dataclass(frozen=True)
class Notification:
    to_email: str
    subject: str
    body: str

class Notifier(Protocol):
    def send(self, n: Notification) -> None: ...


class ConsoleNotifier:
    # pylint: disable=unused-argument
    def send(self, n: Notification) -> None:
        print("\n" + "=" * 72)
        print("[NOTIFY:CONSOLE]")
        print(f"To: {n.to_email}")
        print(f"Subject: {n.subject}")
        print("-" * 72)
        print(n.body)
        print("=" * 72 + "\n")


class SmtpNotifier:
    def __init__(self) -> None:
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.username = settings.smtp_username
        self.password = settings.smtp_password
        self.from_email = settings.smtp_from_email
        self.use_tls = settings.smtp_use_tls

        missing = []
        if not self.host:
            missing.append("SMTP_HOST")
        if not self.port:
            missing.append("SMTP_PORT")
        if not self.from_email:
            missing.append("SMTP_FROM_EMAIL")

        if missing:
            raise RuntimeError(f"Missing SMTP settings: {', '.join(missing)}")

    def send(self, n: Notification) -> None:
        msg = EmailMessage()
        msg["From"] = self.from_email
        msg["To"] = n.to_email
        msg["Subject"] = n.subject
        msg.set_content(n.body)

        with smtplib.SMTP(self.host, self.port, timeout=10) as server:
            if self.use_tls:
                server.starttls()
            if self.username and self.password:
                server.login(self.username, self.password)
            server.send_message(msg)


def get_notifier() -> Notifier:
    backend = (settings.notify_backend or "console").lower().strip()
    if backend == "smtp":
        return SmtpNotifier()
    return ConsoleNotifier()
