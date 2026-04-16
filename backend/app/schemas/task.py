from marshmallow import EXCLUDE, Schema, fields, validate


class TaskCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    title = fields.String(required=True, validate=validate.Length(min=1, max=500))
    description = fields.String(load_default="")


class TaskUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    title = fields.String(validate=validate.Length(min=1, max=500))
    description = fields.String()
    completed = fields.Boolean()


class TaskOutSchema(Schema):
    id = fields.Integer()
    title = fields.String()
    description = fields.String()
    completed = fields.Boolean()
    created_at = fields.DateTime(format="iso")
    updated_at = fields.DateTime(format="iso")
