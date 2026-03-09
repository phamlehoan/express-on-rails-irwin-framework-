import { Request, Response, NextFunction } from "express";
import models from "@models";

export type FeatureWithChildren = Awaited<
  ReturnType<typeof models.feature.findFirst>
> & { children?: FeatureWithChildren[] };

/**
 * Build feature tree from flat list.
 */
export function buildFeatureTree(
  flat: Array<{ id: string; parentId: string | null; [k: string]: unknown }>
): FeatureWithChildren[] {
  const byId = new Map<string, FeatureWithChildren>();
  for (const f of flat) {
    byId.set(f.id, { ...f, children: [] } as unknown as FeatureWithChildren);
  }
  const roots: FeatureWithChildren[] = [];
  for (const f of byId.values()) {
    if (!f.parentId) {
      roots.push(f);
    } else {
      const parent = byId.get(f.parentId);
      if (parent?.children) {
        parent.children.push(f);
        parent.children.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      } else roots.push(f);
    }
  }
  roots.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return roots;
}

export async function adminFeaturesMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const flat = await models.feature.findMany({
      where: { deleted: false },
      orderBy: [{ parentId: "asc" }, { code: "asc" }],
    });
    res.locals.sidebarFeatures = buildFeatureTree(flat);
  } catch {
    res.locals.sidebarFeatures = [];
  }
  next();
}
