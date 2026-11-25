import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { DatabaseSync } from "node:sqlite"

const MINUTE = 60_000
const COOLDOWN = MINUTE
const TTL = 3 * MINUTE
const TRIES = 5

export class OtpLimit extends Error {
  retryAfter: number
  constructor(ms: number) {
    super("OTP limit reached")
    this.retryAfter = Math.max(1, Math.ceil(ms / 1000))
  }
}

// ponytail: all workers share one durable local filesystem. Multi-host needs a shared DB.
export class OtpStore {
  private path: string
  private secret: string
  constructor(path: string, secret: string) {
    this.path = path
    this.secret = secret
  }

  private mac(...fields: string[]) {
    return createHmac("sha256", this.secret)
      .update(fields.join("\0"))
      .digest("hex")
  }

  private write<T>(action: (db: DatabaseSync, now: number) => T): T {
    const db = new DatabaseSync(this.path)
    try {
      db.exec(`PRAGMA busy_timeout=2000; BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS otp_challenge (
          phone TEXT PRIMARY KEY, generation TEXT NOT NULL, digest TEXT NOT NULL,
          expires INTEGER NOT NULL, tries INTEGER NOT NULL, active INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS otp_limit (id TEXT PRIMARY KEY, until INTEGER NOT NULL, count INTEGER NOT NULL);
        CREATE INDEX IF NOT EXISTS otp_limit_expiry ON otp_limit(until);
        CREATE INDEX IF NOT EXISTS otp_challenge_expiry ON otp_challenge(expires);`)
      const now = Date.now()
      db.prepare("DELETE FROM otp_challenge WHERE expires <= ?").run(now)
      db.prepare("DELETE FROM otp_limit WHERE until <= ?").run(now)
      const result = action(db, now)
      db.exec("COMMIT")
      return result
    } finally {
      db.close() // Rolls back any unfinished transaction.
    }
  }

  private limit(
    db: DatabaseSync,
    now: number,
    id: string,
    max: number,
    duration: number
  ) {
    const row = db
      .prepare("SELECT count, until FROM otp_limit WHERE id=?")
      .get(id)
    if (row && Number(row.count) >= max)
      throw new OtpLimit(Number(row.until) - now)
    db.prepare(
      `INSERT INTO otp_limit VALUES(?,?,1)
      ON CONFLICT(id) DO UPDATE SET count=count+1`
    ).run(id, now + duration)
  }

  reserve(phone: string, ip: string | null, code: string) {
    const key = this.mac("phone", phone)
    const generation = randomUUID()
    this.write((db, now) => {
      this.limit(db, now, "send:all", 120, 60 * MINUTE)
      if (ip) this.limit(db, now, this.mac("send:ip", ip), 15, 60 * MINUTE)
      this.limit(db, now, `send:${key}`, 5, 60 * MINUTE)
      this.limit(db, now, `cooldown:${key}`, 1, COOLDOWN)
      db.prepare(
        "INSERT OR REPLACE INTO otp_challenge VALUES(?,?,?,?,?,0)"
      ).run(
        key,
        generation,
        this.mac("code", key, generation, code),
        now + TTL,
        TRIES
      )
    })
    return generation
  }

  finish(phone: string, generation: string, delivered: boolean) {
    return this.write((db) => {
      const sql = delivered
        ? "UPDATE otp_challenge SET active=1"
        : "DELETE FROM otp_challenge"
      return (
        db
          .prepare(`${sql} WHERE phone=? AND generation=? AND active=0`)
          .run(this.mac("phone", phone), generation).changes === 1
      )
    })
  }

  consume(phone: string, ip: string | null, code: string) {
    const key = this.mac("phone", phone)
    return this.write((db, now) => {
      this.limit(db, now, "verify:all", 600, 15 * MINUTE)
      if (ip) this.limit(db, now, this.mac("verify:ip", ip), 40, 15 * MINUTE)
      this.limit(db, now, `verify:${key}`, 10, 15 * MINUTE)
      const row = db
        .prepare("SELECT * FROM otp_challenge WHERE phone=? AND active=1")
        .get(key)
      if (!row) return false
      const accepted = timingSafeEqual(
        Buffer.from(String(row.digest), "hex"),
        Buffer.from(this.mac("code", key, String(row.generation), code), "hex")
      )
      if (accepted || row.tries === 1)
        db.prepare("DELETE FROM otp_challenge WHERE phone=?").run(key)
      else
        db.prepare("UPDATE otp_challenge SET tries=tries-1 WHERE phone=?").run(
          key
        )
      return accepted
    })
  }
}

export const retryAfter = COOLDOWN / 1000
