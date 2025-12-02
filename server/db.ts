import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, reminders, financeEntries, taxProfiles, InsertReminder, InsertFinanceEntry, InsertTaxProfile } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPreferences(userId: number, preferences: {
  locale?: string;
  defaultCurrency?: string;
  canton?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(preferences).where(eq(users.id, userId));
}

// ========== Reminders ==========

export async function getUserReminders(userId: number, options?: {
  startDate?: Date;
  endDate?: Date;
  status?: 'offen' | 'erledigt' | 'überfällig';
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(reminders).where(eq(reminders.userId, userId));

  const conditions = [eq(reminders.userId, userId)];
  
  if (options?.startDate) {
    conditions.push(gte(reminders.dueDate, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(reminders.dueDate, options.endDate));
  }
  if (options?.status) {
    conditions.push(eq(reminders.status, options.status));
  }

  const result = await db.select().from(reminders)
    .where(and(...conditions))
    .orderBy(reminders.dueDate);

  return result;
}

export async function createReminder(reminder: InsertReminder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reminders).values(reminder);
  return result;
}

export async function updateReminder(id: number, userId: number, data: Partial<InsertReminder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reminders)
    .set(data)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
}

export async function deleteReminder(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
}

// ========== Finance Entries ==========

export async function getUserFinanceEntries(userId: number, options?: {
  startDate?: Date;
  endDate?: Date;
  type?: 'einnahme' | 'ausgabe';
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(financeEntries.userId, userId)];
  
  if (options?.startDate) {
    conditions.push(gte(financeEntries.date, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(financeEntries.date, options.endDate));
  }
  if (options?.type) {
    conditions.push(eq(financeEntries.type, options.type));
  }

  const result = await db.select().from(financeEntries)
    .where(and(...conditions))
    .orderBy(desc(financeEntries.date));

  return result;
}

export async function createFinanceEntry(entry: InsertFinanceEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(financeEntries).values(entry);
  return result;
}

export async function updateFinanceEntry(id: number, userId: number, data: Partial<InsertFinanceEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(financeEntries)
    .set(data)
    .where(and(eq(financeEntries.id, id), eq(financeEntries.userId, userId)));
}

export async function deleteFinanceEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(financeEntries)
    .where(and(eq(financeEntries.id, id), eq(financeEntries.userId, userId)));
}

// ========== Tax Profiles ==========

export async function getUserTaxProfiles(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(taxProfiles)
    .where(eq(taxProfiles.userId, userId))
    .orderBy(desc(taxProfiles.taxYear));

  return result;
}

export async function getTaxProfileByYear(userId: number, year: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(taxProfiles)
    .where(and(eq(taxProfiles.userId, userId), eq(taxProfiles.taxYear, year)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createTaxProfile(profile: InsertTaxProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(taxProfiles).values(profile);
  return result;
}

export async function updateTaxProfile(id: number, userId: number, data: Partial<InsertTaxProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(taxProfiles)
    .set(data)
    .where(and(eq(taxProfiles.id, id), eq(taxProfiles.userId, userId)));
}

export async function deleteTaxProfile(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(taxProfiles)
    .where(and(eq(taxProfiles.id, id), eq(taxProfiles.userId, userId)));
}
