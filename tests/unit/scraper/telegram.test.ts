// tests/unit/scraper/telegram.test.ts
//
// Unit tests for the Telegram scraper. Since scrapeChannel() calls the
// Telegram Bot API, we mock `fetch` to simulate API responses and test
// the message filtering, metadata extraction, and pagination logic.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TelegramScraper } from "@/lib/scraper/telegram";
import { RateLimiter } from "@/lib/scraper/rate-limiter";

// We use a real RateLimiter with generous limits — waitForSlot() resolves
// instantly since no requests are recorded between calls in tests.

// Helper to create a mock Telegram API response
function makeTelegramResponse(
  updates: Array<{
    update_id: number;
    channel_post?: Record<string, unknown>;
    message?: Record<string, unknown>;
  }>,
  ok = true
) {
  return {
    ok,
    json: () => Promise.resolve({ ok, result: updates }),
    status: 200,
  };
}

describe("TelegramScraper", () => {
  let scraper: TelegramScraper;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    const rateLimiter = new RateLimiter({ maxRequests: 30, windowMs: 1000 });
    scraper = new TelegramScraper("test-bot-token", rateLimiter, {
      batchSize: 10,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array when API returns no updates", async () => {
    mockFetch.mockResolvedValueOnce(makeTelegramResponse([]));
    const posts = await scraper.scrapeChannel("12345");
    expect(posts).toEqual([]);
  });

  it("extracts posts from channel_post updates with financial keywords", async () => {
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 1,
          channel_post: {
            message_id: 100,
            date: 1700000000,
            text: "Buy RELIANCE target 2500 SL 2350",
            chat: { id: 12345, title: "StockTips", type: "channel" },
            views: 500,
            forwards: 10,
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("12345");

    expect(posts).toHaveLength(1);
    expect(posts[0]!.platformPostId).toBe("12345_100");
    expect(posts[0]!.content).toBe("Buy RELIANCE target 2500 SL 2350");
    expect(posts[0]!.metadata).toMatchObject({
      messageId: 100,
      chatId: 12345,
      chatTitle: "StockTips",
      viewCount: 500,
      forwardCount: 10,
    });
  });

  it("extracts posts from regular message updates", async () => {
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 2,
          message: {
            message_id: 200,
            date: 1700001000,
            text: "Sell INFY entry 1500 target 1400 stoploss 1600",
            chat: { id: 67890, title: "TradeAlerts", type: "supergroup" },
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("67890");
    expect(posts).toHaveLength(1);
    expect(posts[0]!.content).toContain("Sell INFY");
  });

  it("filters out messages without financial keywords", async () => {
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 3,
          channel_post: {
            message_id: 300,
            date: 1700002000,
            text: "Good morning everyone! Have a great day!",
            chat: { id: 12345, title: "StockTips", type: "channel" },
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("12345");
    expect(posts).toHaveLength(0);
  });

  it("uses caption text when message has no text (photo posts)", async () => {
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 4,
          channel_post: {
            message_id: 400,
            date: 1700003000,
            caption: "Buy TCS target 3800",
            chat: { id: 12345, title: "StockTips", type: "channel" },
            photo: [
              { file_id: "small_photo_id" },
              { file_id: "large_photo_id" },
            ],
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("12345");
    expect(posts).toHaveLength(1);
    expect(posts[0]!.content).toBe("Buy TCS target 3800");
    expect(posts[0]!.mediaUrls).toEqual(["tg://file/large_photo_id"]);
  });

  it("correctly converts Unix timestamp to Date", async () => {
    const timestamp = 1700000000; // 2023-11-14T22:13:20.000Z
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 5,
          channel_post: {
            message_id: 500,
            date: timestamp,
            text: "Buy NIFTY target 20000",
            chat: { id: 12345, title: "Test", type: "channel" },
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("12345");
    expect(posts[0]!.postedAt.getTime()).toBe(timestamp * 1000);
  });

  it("filters by channel ID when specified", async () => {
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 6,
          channel_post: {
            message_id: 600,
            date: 1700004000,
            text: "Buy RELIANCE target 2500",
            chat: { id: 11111, title: "OtherChannel", type: "channel" },
          },
        },
        {
          update_id: 7,
          channel_post: {
            message_id: 601,
            date: 1700005000,
            text: "Sell HDFCBANK target 1500",
            chat: { id: 12345, title: "StockTips", type: "channel" },
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("12345");
    expect(posts).toHaveLength(1);
    expect(posts[0]!.metadata).toMatchObject({ chatId: 12345 });
  });

  it("handles empty text and caption gracefully", async () => {
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 8,
          channel_post: {
            message_id: 800,
            date: 1700006000,
            chat: { id: 12345, title: "Test", type: "channel" },
            // No text or caption
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("12345");
    expect(posts).toHaveLength(0);
  });

  it("defaults view and forward counts to 0 when not present", async () => {
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 9,
          channel_post: {
            message_id: 900,
            date: 1700007000,
            text: "Buy SBIN target 650",
            chat: { id: 12345, title: "Test", type: "channel" },
            // No views or forwards fields
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("12345");
    expect(posts[0]!.metadata).toMatchObject({
      viewCount: 0,
      forwardCount: 0,
    });
  });

  it("throws AppError on non-ok HTTP response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ ok: false, description: "Unauthorized" }),
    });

    await expect(scraper.scrapeChannel("12345")).rejects.toThrow(
      "Telegram API error: 401"
    );
  });

  it("throws AppError wrapping network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

    await expect(scraper.scrapeChannel("12345")).rejects.toThrow(
      "Telegram scrape error: Network timeout"
    );
  });

  it("stops pagination when fewer results than batch size returned", async () => {
    // First call: returns 10 results (= batchSize), so will try again
    const fullBatch = Array.from({ length: 10 }, (_, i) => ({
      update_id: 100 + i,
      channel_post: {
        message_id: 1000 + i,
        date: 1700000000 + i * 100,
        text: `Buy RELIANCE target ${2500 + i * 10}`,
        chat: { id: 12345, title: "Tips", type: "channel" },
      },
    }));
    mockFetch.mockResolvedValueOnce(makeTelegramResponse(fullBatch));

    // Second call: returns fewer → stops
    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 200,
          channel_post: {
            message_id: 2000,
            date: 1700010000,
            text: "Buy TCS target 3800",
            chat: { id: 12345, title: "Tips", type: "channel" },
          },
        },
      ])
    );

    const posts = await scraper.scrapeChannel("12345");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(posts.length).toBe(11); // 10 + 1
  });
});

describe("TelegramScraper.scrapeMany", () => {
  it("groups posts by channel ID", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    mockFetch.mockResolvedValueOnce(
      makeTelegramResponse([
        {
          update_id: 1,
          channel_post: {
            message_id: 1,
            date: 1700000000,
            text: "Buy RELIANCE target 2500",
            chat: { id: 111, title: "Channel1", type: "channel" },
          },
        },
        {
          update_id: 2,
          channel_post: {
            message_id: 2,
            date: 1700001000,
            text: "Sell INFY target 1400",
            chat: { id: 222, title: "Channel2", type: "channel" },
          },
        },
      ])
    );
    // Second call returns empty (pagination stop)
    mockFetch.mockResolvedValueOnce(makeTelegramResponse([]));

    const rateLimiter = new RateLimiter({ maxRequests: 30, windowMs: 1000 });
    const scraper = new TelegramScraper("test-token", rateLimiter, {
      batchSize: 100,
    });

    const results = await scraper.scrapeMany(["111", "222", "333"]);

    expect(results.get("111")?.postsFound).toBe(1);
    expect(results.get("222")?.postsFound).toBe(1);
    expect(results.get("333")?.postsFound).toBe(0);

    vi.restoreAllMocks();
  });
});
