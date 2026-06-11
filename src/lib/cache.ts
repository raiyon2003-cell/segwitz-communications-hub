import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getCachedCategories = unstable_cache(
  async () =>
    prisma.emailCategory.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    }),
  ["email-categories"],
  { revalidate: 300, tags: ["categories"] }
);

export const getCachedDepartments = unstable_cache(
  async () =>
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
        divisionId: true,
        createdAt: true,
        updatedAt: true,
        division: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
  ["departments-list"],
  { revalidate: 300, tags: ["departments"] }
);
