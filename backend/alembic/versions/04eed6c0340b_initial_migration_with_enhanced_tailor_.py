"""Initial migration with enhanced tailor schema.

Revision ID: 04eed6c0340b
Revises:
Create Date: 2026-03-24 12:59:57.473736
"""

from typing import Sequence, Union

from alembic import op

from models import Base


# revision identifiers, used by Alembic.
revision: str = "04eed6c0340b"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the initial schema using the shared ORM metadata.

    `checkfirst=True` makes this safe for local SQLite databases where some
    tables may already exist because they were created manually or by a
    previously failed migration attempt.
    """

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind, checkfirst=True)
