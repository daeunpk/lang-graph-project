import uuid

def generate_id(prefix=""):
    return f"{prefix}{str(uuid.uuid4())}"