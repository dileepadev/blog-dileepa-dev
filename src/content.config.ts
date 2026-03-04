import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    banner: z.string().optional(),
    bannerAlt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  posts,
};
