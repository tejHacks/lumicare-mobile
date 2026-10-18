import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

export const DATABASE_NAME = "lumicare.db";
const DATABASE_VERSION = 1;
const MIGRATION_KEY = "legacy-async-storage-migration-v1";
const ZUSTAND_STORAGE_KEY = "lumicare-app-state";
const IMAGE_DIRECTORY = "lumicare-screening-images";
const LEGACY_RECORD_PREFIX = "lumicare:screening:";
const LEGACY_IMAGE_PREFIX = "lumicare:screening-image:";
const DATABASE_KEY_NAME = "lumicare-sqlcipher-key";

export type ScreeningStatus = "clear" | "possible" | "inconclusive";

export type ScreeningRecord = {
  id: number;
  babyName: string;
  date: string;
  riskScore: ScreeningStatus | string;
  imagePath: string | null;
  notes: string;
  dateOfBirth: string | null;
  demo: boolean;
  legacyId: string | null;
};

export type NewScreeningRecord = Omit<ScreeningRecord, "id">;

type LegacyScreening = {
  id?: string | number;
  babyName?: string;
  createdAt?: string;
  date?: string;
  status?: string;
  riskScore?: string;
  notes?: string;
  dateOfBirth?: string;
  demo?: boolean;
  imageUri?: string;
  imageBase64?: string;
  imageStorageKey?: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

function appDocumentDirectory() {
  if (Platform.OS === "web") {
    throw new Error("Local document files are available only in the mobile app.");
  }
  return new Directory(Paths.document, IMAGE_DIRECTORY);
}

async function saveLegacyImage(
  imageUri: string | undefined,
  imageBase64: string | undefined,
  name: string,
) {
  const directory = appDocumentDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const destination = new File(directory, `${name}.jpg`);

  if (imageBase64) {
    destination.create({ overwrite: true, intermediates: true });
    destination.write(imageBase64, { encoding: "base64" });
    return destination.uri;
  }
  if (imageUri && imageUri.startsWith("file://")) {
    const source = new File(imageUri);
    if (source.exists) {
      await source.copy(destination, { overwrite: true });
      return destination.uri;
    }
  }
  return null;
}

function parseLegacyJson(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

async function importLegacyAsyncStorage(db: SQLite.SQLiteDatabase) {
  const alreadyMigrated = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    MIGRATION_KEY,
  );
  if (alreadyMigrated?.value === "done") return;

  const keys = await AsyncStorage.getAllKeys();
  for (const key of keys) {
    if (!key.startsWith(LEGACY_RECORD_PREFIX)) continue;
    const value = await AsyncStorage.getItem(key);
    const record = parseLegacyJson(value) as LegacyScreening | undefined;
    if (!record) continue;

    const legacyId = String(record.id ?? key.slice(LEGACY_RECORD_PREFIX.length));
    const existing = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM screenings WHERE legacyId = ?",
      legacyId,
    );
    if (existing) continue;

    const imageKey = record.imageStorageKey ?? `${LEGACY_IMAGE_PREFIX}${legacyId}`;
    const imageBase64 = record.imageBase64 ?? await AsyncStorage.getItem(imageKey) ?? undefined;
    const imagePath = Platform.OS === "web"
      ? null
      : await saveLegacyImage(record.imageUri, imageBase64, `legacy-${Crypto.randomUUID()}`);
    await db.runAsync(
      `INSERT INTO screenings
        (babyName, date, riskScore, imagePath, notes, dateOfBirth, demo, legacyId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      record.babyName?.trim() || "Baby",
      record.createdAt ?? record.date ?? new Date().toISOString(),
      record.riskScore ?? record.status ?? "inconclusive",
      imagePath,
      record.notes ?? "",
      record.dateOfBirth ?? null,
      record.demo ? 1 : 0,
      legacyId,
    );
  }

  const legacy = (key: string) => AsyncStorage.getItem(key);
  const profile = parseLegacyJson(await legacy("lumicare:caregiver-profile")) as
    | { firstName?: string; lastName?: string }
    | undefined;
  const activeBaby = parseLegacyJson(await legacy("lumicare:active-baby")) as
    | { name?: string; dateOfBirth?: string }
    | undefined;
  const referralContact = parseLegacyJson(await legacy("lumicare:referral-contact")) as
    | { name?: string; phone?: string; facility?: string }
    | undefined;
  const reminders = parseLegacyJson(await legacy("lumicare:follow-up-reminders"));
  const initialState = {
    languageCode: await legacy("lumicare:language") ?? "en",
    caregiverProfile: profile ?? null,
    offlineTipSeen: await legacy("lumicare:offline-tip-seen") === "true",
    activeBaby: activeBaby
      ? { name: activeBaby.name ?? "", dateOfBirth: activeBaby.dateOfBirth ?? "" }
      : null,
    referralContact: referralContact
      ? {
          name: referralContact.name ?? "",
          phone: referralContact.phone ?? "",
          facility: referralContact.facility ?? "",
        }
      : { name: "", phone: "", facility: "" },
    reminders: Array.isArray(reminders) ? reminders : [],
  };
  await db.runAsync(
    "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)",
    ZUSTAND_STORAGE_KEY,
    JSON.stringify({ state: initialState, version: 0 }),
  );
  await db.runAsync(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
    MIGRATION_KEY,
    "done",
  );

  // Retain the old copy until all relational imports and the state snapshot succeed.
  const lumiCareKeys = keys.filter((key) => key.startsWith("lumicare:"));
  if (lumiCareKeys.length) await AsyncStorage.multiRemove(lumiCareKeys);
}

async function openAndInitializeDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  if (Platform.OS !== "web") {
    let key = await SecureStore.getItemAsync(DATABASE_KEY_NAME);
    if (!key) {
      key = Array.from(await Crypto.getRandomBytesAsync(32))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
  }

  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS screenings (
      id INTEGER PRIMARY KEY,
      babyName TEXT NOT NULL,
      date TEXT NOT NULL,
      riskScore TEXT NOT NULL,
      imagePath TEXT,
      notes TEXT NOT NULL DEFAULT '',
      dateOfBirth TEXT,
      demo INTEGER NOT NULL DEFAULT 0,
      legacyId TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_screenings_date ON screenings(date DESC);
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  await importLegacyAsyncStorage(db);
  return db;
}

export function initializeDatabase() {
  if (!databasePromise) databasePromise = openAndInitializeDatabase();
  return databasePromise;
}

export async function getAppSetting(key: string) {
  const db = await initializeDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    key,
  );
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string) {
  const db = await initializeDatabase();
  await db.runAsync(
    "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}

export async function removeAppSetting(key: string) {
  const db = await initializeDatabase();
  await db.runAsync("DELETE FROM app_settings WHERE key = ?", key);
}

export async function countScreenings() {
  const db = await initializeDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM screenings",
  );
  return row?.count ?? 0;
}

export async function getAllScreenings() {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<Omit<ScreeningRecord, "demo"> & { demo: number }>(
    "SELECT id, babyName, date, riskScore, imagePath, notes, dateOfBirth, demo, legacyId FROM screenings ORDER BY date DESC",
  );
  return rows.map((row) => ({ ...row, demo: Boolean(row.demo) }));
}

export async function getScreeningById(id: number) {
  const db = await initializeDatabase();
  const row = await db.getFirstAsync<Omit<ScreeningRecord, "demo"> & { demo: number }>(
    "SELECT id, babyName, date, riskScore, imagePath, notes, dateOfBirth, demo, legacyId FROM screenings WHERE id = ?",
    id,
  );
  return row ? { ...row, demo: Boolean(row.demo) } : null;
}

export async function insertScreening(record: NewScreeningRecord) {
  const db = await initializeDatabase();
  const result = await db.runAsync(
    `INSERT INTO screenings
      (babyName, date, riskScore, imagePath, notes, dateOfBirth, demo, legacyId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    record.babyName,
    record.date,
    record.riskScore,
    record.imagePath,
    record.notes,
    record.dateOfBirth,
    record.demo ? 1 : 0,
    record.legacyId,
  );
  return result.lastInsertRowId;
}

export async function deleteScreening(id: number) {
  const record = await getScreeningById(id);
  if (!record) return;
  const db = await initializeDatabase();
  await db.runAsync("DELETE FROM screenings WHERE id = ?", id);
  if (record.imagePath && Platform.OS !== "web") {
    try {
      const file = new File(record.imagePath);
      if (file.exists) file.delete();
    } catch {
      // Remove the database record even if its image was already removed.
    }
  }
}