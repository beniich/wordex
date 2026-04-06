import asyncio
import os
import uuid
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()

    # 1. Create a default Organisation if none exists
    org = await db.organisation.find_first(where={'slug': 'default'})
    if not org:
        org = await db.organisation.create(
            data={
                'name': 'Default Clinic',
                'slug': 'default',
                'plan': 'FREE'
            }
        )
        print(f"✅ Created default organisation: {org.name}")
    else:
        print(f"ℹ️ Default organisation already exists: {org.name}")

    # 2. Assign existing users to this organisation
    # Note: This is an idempotent script.
    users = await db.user.find_many(where={'organisation_id': None}) # This might fail if schema is already pushed as non-nullable
    # Actually, we should use raw SQL to find and update since Prisma types might enforce the ID.
    
    # Let's use raw SQL for the migration to be safe
    await db.execute_raw(
        "UPDATE \"User\" SET organisation_id = $1 WHERE organisation_id IS NULL",
        org.id
    )
    
    await db.execute_raw(
        "UPDATE \"Workspace\" SET organisation_id = $1 WHERE organisation_id IS NULL",
        org.id
    )

    print("✅ Migrated existing users and workspaces to default organisation.")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
