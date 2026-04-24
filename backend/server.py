from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Guardião Família API")
api_router = APIRouter(prefix="/api")


# =====================
# Models
# =====================
class Child(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    avatar: str = "person"
    device: str = "Android"
    battery: int = 85
    online: bool = True
    last_seen: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LocationPoint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    latitude: float
    longitude: float
    place: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AppUsage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    app_name: str
    icon: str
    category: str  # Social, Jogos, Educação, Vídeo, Outros
    minutes: int
    blocked: bool = False
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))


class Geofence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    name: str
    latitude: float
    longitude: float
    radius: int  # meters
    active: bool = True


class GeofenceCreate(BaseModel):
    child_id: str
    name: str
    latitude: float
    longitude: float
    radius: int = 200


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    type: str  # geofence, screen_time, app_blocked, content, low_battery
    title: str
    description: str
    severity: str = "info"  # info, warning, danger
    read: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ScreenTime(BaseModel):
    child_id: str
    today_minutes: int
    limit_minutes: int
    week: List[int]  # last 7 days, minutes per day


class ToggleBlock(BaseModel):
    blocked: bool


class LimitUpdate(BaseModel):
    limit_minutes: int


# =====================
# Seed data
# =====================
async def seed_if_empty():
    count = await db.children.count_documents({})
    if count > 0:
        return

    now = datetime.now(timezone.utc)
    children = [
        Child(name="Sofia", age=10, device="iPhone 13", battery=78, online=True,
              last_seen=now.isoformat()).dict(),
        Child(name="Lucas", age=13, device="Samsung A54", battery=45, online=True,
              last_seen=(now - timedelta(minutes=3)).isoformat()).dict(),
    ]
    await db.children.insert_many([c.copy() for c in children])

    for child in children:
        cid = child["id"]
        # Locations (history)
        base_lat, base_lng = (-23.5505, -46.6333)  # SP
        locations = []
        places = ["Escola Municipal", "Parque Central", "Casa da Avó", "Shopping Vila", "Casa"]
        for i, p in enumerate(places):
            locations.append(LocationPoint(
                child_id=cid,
                latitude=base_lat + (i * 0.004) * (1 if child["name"] == "Sofia" else -1),
                longitude=base_lng + (i * 0.003),
                place=p,
                timestamp=(now - timedelta(hours=(len(places) - i) * 2)).isoformat(),
            ).dict())
        await db.locations.insert_many([l.copy() for l in locations])

        # Geofences
        geos = [
            Geofence(child_id=cid, name="Casa", latitude=base_lat, longitude=base_lng, radius=150).dict(),
            Geofence(child_id=cid, name="Escola", latitude=base_lat + 0.008,
                     longitude=base_lng + 0.006, radius=200).dict(),
        ]
        await db.geofences.insert_many([g.copy() for g in geos])

        # App usage today
        apps_sofia = [
            ("YouTube Kids", "play", "Vídeo", 62, False),
            ("TikTok", "music", "Social", 48, True),
            ("Roblox", "game-controller", "Jogos", 95, False),
            ("WhatsApp", "chatbubble", "Social", 22, False),
            ("Duolingo", "school", "Educação", 18, False),
            ("Instagram", "camera", "Social", 30, True),
        ]
        apps_lucas = [
            ("YouTube", "logo-youtube", "Vídeo", 110, False),
            ("Fortnite", "game-controller", "Jogos", 140, False),
            ("Discord", "chatbubble", "Social", 55, False),
            ("Chrome", "globe", "Outros", 25, False),
            ("Netflix", "film", "Vídeo", 40, False),
            ("TikTok", "musical-notes", "Social", 70, True),
        ]
        apps = apps_sofia if child["name"] == "Sofia" else apps_lucas
        docs = [AppUsage(child_id=cid, app_name=n, icon=ic, category=cat,
                         minutes=m, blocked=b).dict() for n, ic, cat, m, b in apps]
        await db.app_usage.insert_many([a.copy() for a in docs])

        # Screen time settings
        week = [180, 210, 165, 240, 195, 260, sum(m for _, _, _, m, _ in apps)]
        await db.screen_time.insert_one({
            "child_id": cid,
            "limit_minutes": 240,
            "week": week,
        })

        # Alerts
        alerts = [
            Alert(child_id=cid, type="geofence",
                  title=f"{child['name']} chegou em Casa",
                  description="Entrou na zona segura há 8 minutos",
                  severity="info").dict(),
            Alert(child_id=cid, type="screen_time",
                  title="Limite de tela quase atingido",
                  description="Restam 15 minutos do limite diário",
                  severity="warning").dict(),
            Alert(child_id=cid, type="app_blocked",
                  title="Tentativa de abrir TikTok",
                  description="Aplicativo bloqueado pelos pais",
                  severity="warning").dict(),
            Alert(child_id=cid, type="content",
                  title="Conteúdo impróprio detectado",
                  description="Site bloqueado automaticamente pelo filtro",
                  severity="danger").dict(),
        ]
        await db.alerts.insert_many([a.copy() for a in alerts])


# =====================
# Routes
# =====================
@api_router.get("/")
async def root():
    return {"message": "Guardião Família API", "status": "ok"}


@api_router.post("/seed")
async def seed():
    await db.children.delete_many({})
    await db.locations.delete_many({})
    await db.geofences.delete_many({})
    await db.app_usage.delete_many({})
    await db.screen_time.delete_many({})
    await db.alerts.delete_many({})
    await seed_if_empty()
    return {"ok": True}


@api_router.get("/children", response_model=List[Child])
async def list_children():
    docs = await db.children.find({}, {"_id": 0}).to_list(100)
    return [Child(**d) for d in docs]


@api_router.get("/children/{child_id}/dashboard")
async def child_dashboard(child_id: str):
    child = await db.children.find_one({"id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(404, "Criança não encontrada")

    loc = await db.locations.find({"child_id": child_id}, {"_id": 0}) \
        .sort("timestamp", -1).to_list(1)
    last_loc = loc[0] if loc else None

    st = await db.screen_time.find_one({"child_id": child_id}, {"_id": 0})
    apps = await db.app_usage.find({"child_id": child_id}, {"_id": 0}).to_list(100)
    today_min = sum(a["minutes"] for a in apps)
    blocked_count = sum(1 for a in apps if a["blocked"])

    unread = await db.alerts.count_documents({"child_id": child_id, "read": False})

    return {
        "child": child,
        "last_location": last_loc,
        "screen_time": {
            "today_minutes": today_min,
            "limit_minutes": st["limit_minutes"] if st else 240,
            "week": st["week"] if st else [],
        },
        "apps_count": len(apps),
        "blocked_count": blocked_count,
        "unread_alerts": unread,
    }


@api_router.get("/children/{child_id}/locations", response_model=List[LocationPoint])
async def get_locations(child_id: str):
    docs = await db.locations.find({"child_id": child_id}, {"_id": 0}) \
        .sort("timestamp", -1).to_list(50)
    return [LocationPoint(**d) for d in docs]


@api_router.get("/children/{child_id}/geofences", response_model=List[Geofence])
async def get_geofences(child_id: str):
    docs = await db.geofences.find({"child_id": child_id}, {"_id": 0}).to_list(50)
    return [Geofence(**d) for d in docs]


@api_router.post("/geofences", response_model=Geofence)
async def create_geofence(data: GeofenceCreate):
    gf = Geofence(**data.dict())
    await db.geofences.insert_one(gf.dict().copy())
    return gf


@api_router.delete("/geofences/{geofence_id}")
async def delete_geofence(geofence_id: str):
    res = await db.geofences.delete_one({"id": geofence_id})
    return {"deleted": res.deleted_count}


@api_router.get("/children/{child_id}/apps", response_model=List[AppUsage])
async def get_apps(child_id: str):
    docs = await db.app_usage.find({"child_id": child_id}, {"_id": 0}).to_list(100)
    return [AppUsage(**d) for d in docs]


@api_router.patch("/apps/{app_id}/block", response_model=AppUsage)
async def toggle_app_block(app_id: str, data: ToggleBlock):
    res = await db.app_usage.find_one_and_update(
        {"id": app_id},
        {"$set": {"blocked": data.blocked}},
        return_document=True,
    )
    if not res:
        raise HTTPException(404, "App não encontrado")
    res.pop("_id", None)
    return AppUsage(**res)


@api_router.get("/children/{child_id}/screen-time")
async def get_screen_time(child_id: str):
    st = await db.screen_time.find_one({"child_id": child_id}, {"_id": 0})
    if not st:
        raise HTTPException(404, "Sem dados")
    apps = await db.app_usage.find({"child_id": child_id}, {"_id": 0}).to_list(100)
    today = sum(a["minutes"] for a in apps)
    by_category = {}
    for a in apps:
        by_category[a["category"]] = by_category.get(a["category"], 0) + a["minutes"]
    return {
        "today_minutes": today,
        "limit_minutes": st["limit_minutes"],
        "week": st["week"],
        "by_category": by_category,
    }


@api_router.patch("/children/{child_id}/screen-time")
async def update_limit(child_id: str, data: LimitUpdate):
    await db.screen_time.update_one(
        {"child_id": child_id},
        {"$set": {"limit_minutes": data.limit_minutes}},
    )
    return {"ok": True, "limit_minutes": data.limit_minutes}


@api_router.get("/children/{child_id}/alerts", response_model=List[Alert])
async def get_alerts(child_id: str):
    docs = await db.alerts.find({"child_id": child_id}, {"_id": 0}) \
        .sort("timestamp", -1).to_list(200)
    return [Alert(**d) for d in docs]


@api_router.patch("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    await db.alerts.update_one({"id": alert_id}, {"$set": {"read": True}})
    return {"ok": True}


@api_router.patch("/children/{child_id}/alerts/read-all")
async def read_all(child_id: str):
    await db.alerts.update_many({"child_id": child_id}, {"$set": {"read": True}})
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed_if_empty()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
