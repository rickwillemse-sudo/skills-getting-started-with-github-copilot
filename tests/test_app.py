import sys
from pathlib import Path

# Ensure `src` is importable so we can import the FastAPI app
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Basic expected activities
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "pytest-student@example.com"

    # Ensure participant is not already registered
    before = client.get("/activities").json()
    participants_before = list(before[activity]["participants"])
    if email in participants_before:
        # If present, remove first to ensure clean test
        client.post(f"/activities/{activity}/unregister?email={email}")

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Verify signup reflected in activities
    after = client.get("/activities").json()
    assert email in after[activity]["participants"]

    # Unregister
    resp2 = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp2.status_code == 200
    assert "Unregistered" in resp2.json().get("message", "")

    # Verify removed
    final = client.get("/activities").json()
    assert email not in final[activity]["participants"]
