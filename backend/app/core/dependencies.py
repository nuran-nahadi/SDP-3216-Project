from app.core.config import settings
from app.core.security import get_current_authenticated_user, check_admin_role
from app.core.dev_security import get_development_user, disable_admin_check


def get_current_user():
    """
    Returns the appropriate user dependency based on auth settings
    """
    if settings.disable_auth:
        return get_development_user
    else:
        return get_current_authenticated_user


def get_admin_check():
    """
    Returns the appropriate admin check dependency based on auth settings
    """
    if settings.disable_auth:
        return disable_admin_check
    else:
        return check_admin_role