from marshmallow import EXCLUDE, Schema, ValidationError, fields, validates, validates_schema


class RegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    name = fields.String(required=True)
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)
    confirm_password = fields.String(required=True, load_only=True)

    @validates("name")
    def validate_name(self, value: str):
        v = (value or "").strip()
        if len(v) < 2:
            raise ValidationError("Name must be at least 2 characters.")

    @validates("password")
    def validate_password(self, value: str):
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters.")
        if not any(c.islower() for c in value):
            raise ValidationError("Password must include a lowercase letter.")
        if not any(c.isupper() for c in value):
            raise ValidationError("Password must include an uppercase letter.")
        if not any(c.isdigit() for c in value):
            raise ValidationError("Password must include a number.")

    @validates_schema
    def passwords_match(self, data, **kwargs):
        if data.get("password") != data.get("confirm_password"):
            raise ValidationError("Passwords do not match.", field_name="confirm_password")


class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)


class LogoutSchema(Schema):
    """Optional refresh token so both access and refresh JITs can be revoked server-side."""

    class Meta:
        unknown = EXCLUDE

    refresh_token = fields.String(required=False, load_only=True)
