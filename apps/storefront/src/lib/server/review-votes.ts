import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"
import type { ReviewFeedback, ReviewVote } from "../review-feedback.ts"

// ponytail: one persistent local volume. Use a shared database for multi-host deployments.
export function reviewVotes(
  product: string,
  reviewIds: string[],
  customer: string | null,
  change?: { review_id: string; vote: ReviewVote | null }
): Record<string, ReviewFeedback> {
  const path =
    process.env.REVIEW_FEEDBACK_DB_PATH ||
    resolve(".ainura-data", "review-votes.sqlite")
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const db = new DatabaseSync(path)
  try {
    db.exec(`PRAGMA busy_timeout=3000;
      CREATE TABLE IF NOT EXISTS vote (
        product TEXT NOT NULL, review TEXT NOT NULL, customer TEXT NOT NULL,
        value TEXT NOT NULL CHECK (value IN ('helpful','unhelpful')),
        PRIMARY KEY (review,customer)
      );
      CREATE INDEX IF NOT EXISTS votes_by_product ON vote(product);
    `)
    if (change) {
      if (!customer || !reviewIds.includes(change.review_id))
        throw new Error("Invalid vote target")
      db.exec("BEGIN IMMEDIATE")
      if (change.vote === null) {
        db.prepare(
          "DELETE FROM vote WHERE product=? AND review=? AND customer=?"
        ).run(product, change.review_id, customer)
      } else {
        db.prepare(
          `INSERT INTO vote(product,review,customer,value) VALUES(?,?,?,?)
          ON CONFLICT(review,customer) DO UPDATE SET value=excluded.value`
        ).run(product, change.review_id, customer, change.vote)
      }
    }
    const result: Record<string, ReviewFeedback> = Object.create(null)
    for (const id of reviewIds)
      result[id] = { helpful: 0, unhelpful: 0, current_vote: null }
    const rows = db
      .prepare(
        `SELECT review, SUM(value='helpful') AS helpful,
      SUM(value='unhelpful') AS unhelpful, MAX(CASE WHEN customer=? THEN value END) AS current_vote
      FROM vote WHERE product=? GROUP BY review`
      )
      .all(customer, product)
    for (const row of rows) {
      const id = String(row.review)
      if (id in result)
        result[id] = {
          helpful: Number(row.helpful),
          unhelpful: Number(row.unhelpful),
          current_vote: row.current_vote as ReviewVote | null,
        }
    }
    if (change) db.exec("COMMIT")
    return result
  } finally {
    db.close() // Also rolls back any unfinished write.
  }
}
