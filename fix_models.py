content = open('back/app/models.py', 'rb').read().decode('utf-8', errors='replace')
idx = content.find('#  Dashboard')
fixed_tail = (
    "\n"
    "#  Dashboard\n"
    "\n"
    "class MachineCreate(BaseModel):\n"
    "    name: str\n"
    '    machine_type: str = "press"\n'
    "    location: Optional[str] = None\n"
    '    status: str = "online"\n'
    "\n"
    "class MachineMetricCreate(BaseModel):\n"
    "    machine_id: uuid.UUID\n"
    "    availability: int = Field(ge=0, le=100)\n"
    "    performance: int = Field(ge=0, le=100)\n"
    "    quality: int = Field(ge=0, le=100)\n"
    '    shift: str = "morning"\n'
    "\n"
    "class ProductionRunCreate(BaseModel):\n"
    "    machine_id: uuid.UUID\n"
    "    shift: str\n"
    "    target_lots: int = 250\n"
    "    actual_lots: int = 0\n"
    "    date: Optional[str] = None\n"
    "\n"
    "class AmdecFailureCreate(BaseModel):\n"
    "    machine_id: uuid.UUID\n"
    "    mode: str\n"
    "    severity: int = Field(ge=1, le=10)\n"
    "    occurrence: int = Field(ge=1, le=10)\n"
    "    detection: int = Field(ge=1, le=10)\n"
    '    status: str = "open"\n'
)
new_content = content[:idx] + fixed_tail
open('back/app/models.py', 'w', encoding='utf-8').write(new_content)
print("Done — models.py fixed, lines:", new_content.count('\n'))
