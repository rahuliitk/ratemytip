// src/lib/utils/market-hours.ts
//
// Host-timezone-independent market hours helpers.
// Extracted from price-worker so they can be unit-tested directly.

import { formatInTimeZone } from "date-fns-tz";

import { EXCHANGE_MARKET_HOURS } from "@/lib/constants";

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Check if NSE market is currently open (9:15 AM - 3:30 PM IST, Mon-Fri).
 * Uses formatInTimeZone for host-timezone-independent IST extraction.
 */
export function isNseMarketOpen(now: Date = new Date()): boolean {
  // ISO day of week: 1=Monday … 6=Saturday, 7=Sunday
  const isoDay = parseInt(formatInTimeZone(now, IST_TIMEZONE, "i"), 10);

  if (isoDay >= 6) return false; // Saturday or Sunday

  const hours = parseInt(formatInTimeZone(now, IST_TIMEZONE, "H"), 10);
  const minutes = parseInt(formatInTimeZone(now, IST_TIMEZONE, "m"), 10);
  const timeInMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15;   // 9:15 AM IST
  const marketClose = 15 * 60 + 30;  // 3:30 PM IST

  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

/**
 * Check if any global market is currently open.
 * Uses IST-aware check for NSE/BSE, UTC-based for other exchanges.
 * Returns true if at least one exchange is currently in trading hours.
 */
export function isAnyMarketOpen(now: Date = new Date()): boolean {
  // Check NSE/BSE with proper IST timezone handling
  if (isNseMarketOpen(now)) return true;

  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 6=Sat

  for (const [exchange, hours] of Object.entries(EXCHANGE_MARKET_HOURS)) {
    // Skip NSE/BSE — already checked with IST-aware function above
    if (exchange === "NSE" || exchange === "BSE") continue;

    // Skip weekday-only exchanges on weekends
    if (hours.weekdays && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    const openMinutes = hours.openUTC.hour * 60 + hours.openUTC.minute;
    const closeMinutes = hours.closeUTC.hour * 60 + hours.closeUTC.minute;

    if (utcMinutes >= openMinutes && utcMinutes <= closeMinutes) {
      return true;
    }
  }

  return false;
}
