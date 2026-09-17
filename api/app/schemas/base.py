from pydantic import BaseModel, ConfigDict


def to_frontend_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(
        part[:1].upper() + part[1:]
        for part in tail
    )


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_frontend_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )
