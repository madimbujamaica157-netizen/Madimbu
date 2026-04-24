"""Parental control backend tests - covers children, dashboard, locations, geofences, apps, screen-time, alerts."""
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://access-guard-26.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # Reset data before tests
    s.post(f"{API}/seed", timeout=30)
    return s


@pytest.fixture(scope="module")
def children(client):
    r = client.get(f"{API}/children", timeout=15)
    assert r.status_code == 200
    return r.json()


# Module: Children
class TestChildren:
    def test_list_children(self, children):
        assert len(children) == 2
        names = sorted(c["name"] for c in children)
        assert names == ["Lucas", "Sofia"]
        for c in children:
            assert "id" in c and "age" in c and "device" in c


# Module: Dashboard
class TestDashboard:
    def test_dashboard(self, client, children):
        cid = children[0]["id"]
        r = client.get(f"{API}/children/{cid}/dashboard", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("child", "last_location", "screen_time", "apps_count", "blocked_count", "unread_alerts"):
            assert k in d
        assert "week" in d["screen_time"]
        assert isinstance(d["screen_time"]["week"], list)
        assert d["apps_count"] == 6

    def test_dashboard_404(self, client):
        r = client.get(f"{API}/children/nonexistent-id/dashboard", timeout=15)
        assert r.status_code == 404


# Module: Locations
class TestLocations:
    def test_locations(self, client, children):
        cid = children[0]["id"]
        r = client.get(f"{API}/children/{cid}/locations", timeout=15)
        assert r.status_code == 200
        locs = r.json()
        assert len(locs) == 5
        for l in locs:
            assert "place" in l and "latitude" in l and "longitude" in l


# Module: Geofences
class TestGeofences:
    def test_get_geofences(self, client, children):
        cid = children[0]["id"]
        r = client.get(f"{API}/children/{cid}/geofences", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_create_and_delete_geofence(self, client, children):
        cid = children[0]["id"]
        payload = {"child_id": cid, "name": "TEST_Parque", "latitude": -23.55, "longitude": -46.63, "radius": 180}
        r = client.post(f"{API}/geofences", json=payload, timeout=15)
        assert r.status_code == 200
        gf = r.json()
        assert gf["name"] == "TEST_Parque"
        gfid = gf["id"]

        # Verify via GET
        r2 = client.get(f"{API}/children/{cid}/geofences", timeout=15)
        assert any(g["id"] == gfid for g in r2.json())

        # Delete
        r3 = client.delete(f"{API}/geofences/{gfid}", timeout=15)
        assert r3.status_code == 200
        assert r3.json()["deleted"] == 1

        # Verify gone
        r4 = client.get(f"{API}/children/{cid}/geofences", timeout=15)
        assert not any(g["id"] == gfid for g in r4.json())


# Module: Apps
class TestApps:
    def test_get_apps(self, client, children):
        cid = children[0]["id"]
        r = client.get(f"{API}/children/{cid}/apps", timeout=15)
        assert r.status_code == 200
        apps = r.json()
        assert len(apps) == 6

    def test_toggle_block(self, client, children):
        cid = children[0]["id"]
        apps = client.get(f"{API}/children/{cid}/apps", timeout=15).json()
        target = next(a for a in apps if not a["blocked"])
        aid = target["id"]
        r = client.patch(f"{API}/apps/{aid}/block", json={"blocked": True}, timeout=15)
        assert r.status_code == 200
        assert r.json()["blocked"] is True
        # Verify persisted
        apps2 = client.get(f"{API}/children/{cid}/apps", timeout=15).json()
        assert any(a["id"] == aid and a["blocked"] is True for a in apps2)
        # Revert
        client.patch(f"{API}/apps/{aid}/block", json={"blocked": False}, timeout=15)

    def test_toggle_block_404(self, client):
        r = client.patch(f"{API}/apps/nonexistent/block", json={"blocked": True}, timeout=15)
        assert r.status_code == 404


# Module: Screen Time
class TestScreenTime:
    def test_get_screen_time(self, client, children):
        cid = children[0]["id"]
        r = client.get(f"{API}/children/{cid}/screen-time", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("today_minutes", "limit_minutes", "week", "by_category"):
            assert k in d
        assert isinstance(d["by_category"], dict)
        assert len(d["week"]) == 7

    def test_update_limit(self, client, children):
        cid = children[0]["id"]
        r = client.patch(f"{API}/children/{cid}/screen-time", json={"limit_minutes": 300}, timeout=15)
        assert r.status_code == 200
        assert r.json()["limit_minutes"] == 300
        # Verify via GET
        r2 = client.get(f"{API}/children/{cid}/screen-time", timeout=15)
        assert r2.json()["limit_minutes"] == 300
        # Revert
        client.patch(f"{API}/children/{cid}/screen-time", json={"limit_minutes": 240}, timeout=15)


# Module: Alerts
class TestAlerts:
    def test_get_alerts(self, client, children):
        cid = children[0]["id"]
        r = client.get(f"{API}/children/{cid}/alerts", timeout=15)
        assert r.status_code == 200
        alerts = r.json()
        assert len(alerts) == 4

    def test_mark_read(self, client, children):
        cid = children[0]["id"]
        alerts = client.get(f"{API}/children/{cid}/alerts", timeout=15).json()
        aid = alerts[0]["id"]
        r = client.patch(f"{API}/alerts/{aid}/read", timeout=15)
        assert r.status_code == 200
        after = client.get(f"{API}/children/{cid}/alerts", timeout=15).json()
        assert any(a["id"] == aid and a["read"] is True for a in after)

    def test_read_all(self, client, children):
        cid = children[1]["id"]
        r = client.patch(f"{API}/children/{cid}/alerts/read-all", timeout=15)
        assert r.status_code == 200
        after = client.get(f"{API}/children/{cid}/alerts", timeout=15).json()
        assert all(a["read"] is True for a in after)


# Module: Seed reset
class TestSeed:
    def test_seed_resets(self, client):
        r = client.post(f"{API}/seed", timeout=30)
        assert r.status_code == 200
        children = client.get(f"{API}/children", timeout=15).json()
        assert len(children) == 2
