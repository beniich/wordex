from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
import asyncpg
import random # Fallback for generating mock timeline if db is empty for demo

from app.auth import get_current_user_id
from app.database import get_db

from app.models import MachineCreate, MachineMetricCreate, ProductionRunCreate, AmdecFailureCreate

router = APIRouter()

# ── Write Endpoints ───────────────────────────────────────────────────────────

@router.post("/machines")
async def create_machine(
    workspace_id: str,
    body: MachineCreate,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    row = await db.fetchrow(
        """INSERT INTO machines (workspace_id, name, machine_type, location, status)
           VALUES ($1, $2, $3, $4, $5) RETURNING id""",
        workspace_id, body.name, body.machine_type, body.location, body.status
    )
    return {"id": row["id"]}

@router.post("/metrics")
async def add_metric(
    workspace_id: str,
    body: MachineMetricCreate,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    await db.execute(
        """INSERT INTO machine_metrics (machine_id, availability, performance, quality, shift)
           VALUES ($1, $2, $3, $4, $5)""",
        body.machine_id, body.availability, body.performance, body.quality, body.shift
    )
    return {"status": "ok"}

@router.post("/seed-demo")
async def seed_demo(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    
    # Create or find machines
    m_names = ["Robot-X1", "Robot-Y2", "CNC-Press-A", "Assembler-Z"]
    m_ids = []
    for name in m_names:
        row = await db.fetchrow("INSERT INTO machines (workspace_id, name) VALUES ($1, $2) RETURNING id", workspace_id, name)
        m_ids.append(row["id"])
        
    # Inject metrics for last 24 hours
    for m_id in m_ids:
        for h in range(24):
            recorded_at = datetime.now() - timedelta(hours=h)
            avail = random.randint(85, 100)
            perf = random.randint(80, 100)
            qual = random.randint(95, 100)
            await db.execute(
                """INSERT INTO machine_metrics (machine_id, availability, performance, quality, recorded_at)
                   VALUES ($1, $2, $3, $4, $5)""",
                m_id, avail, perf, qual, recorded_at
            )
            
    # Inject production runs for today
    shifts = ["Equipe A", "Equipe B", "Equipe C"]
    for i, shift in enumerate(shifts):
        await db.execute(
            """INSERT INTO production_runs (workspace_id, machine_id, shift, target_lots, actual_lots)
               VALUES ($1, $2, $3, $4, $5)""",
            workspace_id, m_ids[0], shift, 250, 200 + (i * 10)
        )
        
    return {"status": "seeded", "machine_count": len(m_ids)}

async def _require_workspace_access(db: asyncpg.Connection, workspace_id: str, user_id: str):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id
    )
    if not row:
        raise HTTPException(403, "Access denied")
    return row

# ── TRS/OEE ───────────────────────────────────────────────────────────────────

@router.get("/trs-oee")
async def get_trs_oee(
    workspace_id: str = Query(...),
    timeframe: str = "24h", 
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    machines = await db.fetch("SELECT id, name FROM machines WHERE workspace_id=$1", workspace_id)
    results = []
    
    for m in machines:
        latest = await db.fetchrow(
            """SELECT availability, performance, quality, oee 
               FROM machine_metrics 
               WHERE machine_id=$1 
               ORDER BY recorded_at DESC LIMIT 1""",
            m["id"]
        )
        
        # If no metrics yet, we fallback to 0 or mock for demo purposes
        if not latest:
            continue
            
        timeline_rows = await db.fetch(
            """SELECT date_trunc('hour', recorded_at) as hour, avg(oee) as val
               FROM machine_metrics 
               WHERE machine_id=$1 AND recorded_at > now() - interval '24 hours'
               GROUP BY hour ORDER BY hour""",
            m["id"]
        )
        
        timeline = [{"time": r["hour"].strftime("%Hh"), "value": int(r["val"])} for r in timeline_rows]
        # Pad timeline if too short
        if len(timeline) == 0:
            timeline = [{"time": f"{h}h", "value": latest["oee"]} for h in range(24)]
            
        results.append({
            "machine": m["name"],
            "availability": latest["availability"],
            "performance": latest["performance"],
            "quality": latest["quality"],
            "oee": latest["oee"],
            "timeline": timeline
        })
        
    return {"machines": results}

# ── Production Tracking ────────────────────────────────────────────────────────

@router.get("/production-tracking")
async def get_production_tracking(
    workspace_id: str = Query(...),
    date: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    
    # Defaults to today
    query_date = f"'{date}'" if date else "CURRENT_DATE"
    
    rows = await db.fetch(f"""
        SELECT shift as equipe, sum(actual_lots) as "lotsProduits", sum(target_lots) as target
        FROM production_runs
        WHERE workspace_id=$1 AND date = {query_date}
        GROUP BY shift
    """, workspace_id)
    
    results = []
    for r in rows:
        target = r["target"] or 1
        oee = min(100, int((r["lotsProduits"] / target) * 100))
        results.append({
            "equipe": r["equipe"],
            "lotsProduits": r["lotsProduits"],
            "target": r["target"],
            "oee": oee
        })
        
    return {"production": results}

# ── S-Curve ───────────────────────────────────────────────────────────────────

@router.get("/s-curve")
async def get_s_curve(
    workspace_id: str = Query(...),
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    
    # En environnement réel, la S-Curve est calculée à partir de la timeline globale des projets (Gantt)
    tasks = await db.fetch(
        """SELECT start_date, end_date, progress 
           FROM gantt_tasks gt 
           JOIN documents d ON gt.document_id = d.id 
           WHERE d.workspace_id = $1""", 
        workspace_id
    )
    
    curve = []
    start_date = datetime(2024, 1, 1)
    ref = 0
    reel = 0
    replan = 0
    
    for i in range(20):
        # Pour une implémentation exacte, il y aurait une aggrégation
        # temporelle SQL par semaine (date_trunc('week', start_date))
        date_str = (start_date + timedelta(weeks=i)).strftime("%Y-%W")
        ref += 5
        if i < 12: reel += 4
        replan += 5
        
        curve.append({
            "date": date_str,
            "reference": ref,
            "replanifie": replan,
            "reel": reel if i < 12 else None
        })
        
    return {
        "curve": curve,
        "completionRate": 0.65,
        "delayPercentage": 12.5
    }

# ── Gantt ──────────────────────────────────────────────────────────────────────

@router.get("/gantt")
async def get_gantt_data(
    workspace_id: str = Query(...),
    project: str = "all",
    team: str = "all", 
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    
    # Aggregated Gantt across multiple documents (Master Project Gantt)
    tasks = await db.fetch(
        """SELECT gt.id, gt.name, gt.start_date::text as start, gt.end_date::text as end, 
                  gt.progress, gt.task_type as type, gt.priority, d.title as project
           FROM gantt_tasks gt
           JOIN documents d ON gt.document_id = d.id
           WHERE d.workspace_id = $1 AND d.is_deleted = false""",
        workspace_id
    )
    
    projects = list(set([t["project"] for t in tasks]))
    
    return {
        "tasks": [dict(t) for t in tasks],
        "projects": projects
    }

# ── AMDEC ──────────────────────────────────────────────────────────────────────

@router.get("/amdec")
async def get_amdec_data(
    workspace_id: str = Query(...),
    risk: str = "all", 
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    
    modes = await db.fetch(
        """SELECT f.mode, f.severity, f.occurrence, f.detection, f.rpn
           FROM amdec_failures f
           WHERE f.workspace_id = $1
           ORDER BY f.rpn DESC
           LIMIT 10""",
        workspace_id
    )
    
    # Compute distribution
    crit_count = await db.fetchval("SELECT count(*) FROM amdec_failures WHERE workspace_id=$1 AND rpn >= 100", workspace_id)
    med_count = await db.fetchval("SELECT count(*) FROM amdec_failures WHERE workspace_id=$1 AND rpn >= 50 AND rpn < 100", workspace_id)
    low_count = await db.fetchval("SELECT count(*) FROM amdec_failures WHERE workspace_id=$1 AND rpn < 50", workspace_id)
    
    critical = await db.fetch(
        """SELECT m.name as equipment, f.mode as failure, f.rpn as impact
           FROM amdec_failures f
           JOIN machines m ON f.machine_id = m.id
           WHERE f.workspace_id = $1 AND f.rpn >= 100
           ORDER BY f.rpn DESC LIMIT 5""",
        workspace_id
    )

    return {
        "failureModes": [dict(m) for m in modes],
        "riskDistribution": [
           {"category": "Critique", "count": crit_count or 0, "color": "#FF6B6B"},
           {"category": "Moyen", "count": med_count or 0, "color": "#FFCC00"},
           {"category": "Mineur", "count": low_count or 0, "color": "#4ECDC4"}
        ],
        "criticalFailures": [dict(c) for c in critical]
    }

