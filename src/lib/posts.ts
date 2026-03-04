import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { toIsoDate } from "./date";

export type PostEntry = CollectionEntry<"posts">;

export interface PostView {
  slug: string;
  title: string;
  description: string;
  publishedDate: string;
  updatedDate?: string;
  tags: string[];
  banner?: string;
  bannerAlt?: string;
}

function toTimestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function toPostView(entry: PostEntry): PostView {
  return {
    slug: entry.slug,
    title: entry.data.title,
    description: entry.data.description,
    publishedDate: toIsoDate(entry.data.publishedDate),
    updatedDate: entry.data.updatedDate
      ? toIsoDate(entry.data.updatedDate)
      : undefined,
    tags: entry.data.tags,
    banner: entry.data.banner,
    bannerAlt: entry.data.bannerAlt,
  };
}

export async function getPostEntries() {
  const entries = await getCollection("posts", ({ data }) => !data.draft);

  return entries.sort((a, b) => {
    // Keep 'Welcome to My Blog' as the first post
    if (a.data.title === "Welcome to My Blog") return -1;
    if (b.data.title === "Welcome to My Blog") return 1;

    // Otherwise, sort by date descending
    return toTimestamp(b.data.publishedDate) - toTimestamp(a.data.publishedDate);
  });
}

export async function getPostViews() {
  const entries = await getPostEntries();
  return entries.map(toPostView);
}

export async function getPostBySlug(slug: string) {
  const entry = await getEntry("posts", slug);
  if (!entry || entry.data.draft) {
    return null;
  }

  return entry;
}

export function getReadNextPosts(entries: PostEntry[], currentPost: PostEntry) {
  const others = entries.filter((entry) => entry.slug !== currentPost.slug);
  const latestPost = others[0] ?? null;

  if (others.length <= 1) {
    return {
      latestPost: latestPost ? toPostView(latestPost) : null,
      recommendedPost: null,
    };
  }

  const remaining = others.slice(1);
  const currentTags = new Set(currentPost.data.tags);

  const related = remaining.filter((entry) =>
    entry.data.tags.some((tag) => currentTags.has(tag)),
  );

  const recommendedPost = related[0] ?? remaining[0] ?? null;

  return {
    latestPost: latestPost ? toPostView(latestPost) : null,
    recommendedPost: recommendedPost ? toPostView(recommendedPost) : null,
  };
}
