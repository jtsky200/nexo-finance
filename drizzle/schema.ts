import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with Nexo-specific fields for locale, currency, and canton preferences.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Nexo-specific user preferences
  locale: varchar("locale", { length: 10 }).default("de-CH").notNull(),
  defaultCurrency: varchar("defaultCurrency", { length: 3 }).default("CHF").notNull(),
  canton: varchar("canton", { length: 2 }), // Swiss canton code (e.g., "ZH", "BE")
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Reminders table for managing appointments, payments, and tasks
 */
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["termin", "zahlung", "aufgabe"]).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  isAllDay: boolean("isAllDay").default(false).notNull(),
  amount: int("amount"), // Stored in cents to avoid decimal issues
  currency: varchar("currency", { length: 3 }),
  recurrenceRule: text("recurrenceRule"), // RRULE format for recurring reminders
  status: mysqlEnum("status", ["offen", "erledigt", "überfällig"]).default("offen").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

/**
 * Finance entries table for tracking income and expenses
 */
export const financeEntries = mysqlTable("financeEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  type: mysqlEnum("type", ["einnahme", "ausgabe"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: int("amount").notNull(), // Stored in cents to avoid decimal issues
  currency: varchar("currency", { length: 3 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  notes: text("notes"),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurrenceRule: text("recurrenceRule"), // RRULE format for recurring entries
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinanceEntry = typeof financeEntries.$inferSelect;
export type InsertFinanceEntry = typeof financeEntries.$inferInsert;

/**
 * Tax profiles table for managing annual tax information
 */
export const taxProfiles = mysqlTable("taxProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taxYear: int("taxYear").notNull(),
  country: varchar("country", { length: 2 }).default("CH").notNull(),
  canton: varchar("canton", { length: 2 }), // Swiss canton code
  status: mysqlEnum("status", ["unvollständig", "vollständig", "archiviert"]).default("unvollständig").notNull(),
  
  // Personal information
  maritalStatus: varchar("maritalStatus", { length: 50 }),
  numberOfChildren: int("numberOfChildren").default(0),
  
  // Income data (stored in cents)
  grossIncome: int("grossIncome"),
  otherIncome: int("otherIncome"),
  
  // Deductions data (stored as JSON for flexibility)
  deductions: text("deductions"), // JSON string with array of deduction objects
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaxProfile = typeof taxProfiles.$inferSelect;
export type InsertTaxProfile = typeof taxProfiles.$inferInsert;
