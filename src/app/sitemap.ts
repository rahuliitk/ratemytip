import { MetadataRoute } from "next";

import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://ratemytip.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard/intraday`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard/swing`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard/positional`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard/long_term`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // Creator pages
  const creators = await db.creator.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });
  const creatorPages: MetadataRoute.Sitemap = creators.map((c) => ({
    url: `${baseUrl}/creator/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Stock pages
  const stocks = await db.stock.findMany({
    where: { isActive: true },
    select: { symbol: true, updatedAt: true },
  });
  const stockPages: MetadataRoute.Sitemap = stocks.map((s) => ({
    url: `${baseUrl}/stock/${s.symbol}`,
    lastModified: s.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...creatorPages, ...stockPages];
}
