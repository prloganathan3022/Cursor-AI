from marshmallow import Schema, fields


class UserOutSchema(Schema):
    id = fields.Integer()
    email = fields.Email()
    name = fields.String()
    created_at = fields.DateTime(format="iso")
