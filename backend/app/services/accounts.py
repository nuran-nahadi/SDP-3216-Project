from sqlalchemy.orm import Session
from app.models.models import User
from app.utils.responses import ResponseHandler
from app.core.security import get_password_hash, get_token_payload


class AccountService:
    @staticmethod
    def get_my_info(db: Session, token):
        user_id = get_token_payload(token.credentials).get('id')
        import uuid
        user_uuid = uuid.UUID(user_id)
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            ResponseHandler.not_found_error("User", user_id)
        return ResponseHandler.get_single_success(user.username, str(user.id), user)

    @staticmethod
    def edit_my_info(db: Session, token, updated_user):
        user_id = get_token_payload(token.credentials).get('id')
        import uuid
        user_uuid = uuid.UUID(user_id)
        db_user = db.query(User).filter(User.id == user_uuid).first()
        if not db_user:
            ResponseHandler.not_found_error("User", user_id)

        for key, value in updated_user.model_dump(exclude_unset=True).items():
            setattr(db_user, key, value)

        db.commit()
        db.refresh(db_user)
        return ResponseHandler.update_success(db_user.username, str(db_user.id), db_user)

    @staticmethod
    def remove_my_account(db: Session, token):
        user_id = get_token_payload(token.credentials).get('id')
        import uuid
        user_uuid = uuid.UUID(user_id)
        db_user = db.query(User).filter(User.id == user_uuid).first()
        if not db_user:
            ResponseHandler.not_found_error("User", user_id)
        db.delete(db_user)
        db.commit()
        return ResponseHandler.delete_success(db_user.username, str(db_user.id), db_user)
