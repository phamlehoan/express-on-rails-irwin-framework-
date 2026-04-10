import models from "@models";

export type FeatureWithChildren = Awaited<
  ReturnType<typeof models.feature.findFirst>
> & { children?: FeatureWithChildren[] };

/**
 * Build feature tree from flat list.
 */
export function buildFeatureTree(
  flat: Array<Awaited<ReturnType<typeof models.feature.findFirst>>>,
): FeatureWithChildren[] {
  const byId = new Map<string, FeatureWithChildren>();
  for (const f of flat) {
    if (!f) continue;
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
        parent.children.sort(
          (a: FeatureWithChildren, b: FeatureWithChildren) => {
            const orderA = (a as { sortOrder?: number | null }).sortOrder ?? 0;
            const orderB = (b as { sortOrder?: number | null }).sortOrder ?? 0;
            return (orderA ?? 0) - (orderB ?? 0);
          },
        );
      } else roots.push(f);
    }
  }
  roots.sort((a: FeatureWithChildren, b: FeatureWithChildren) => {
    const orderA = (a as { sortOrder?: number | null }).sortOrder ?? 0;
    const orderB = (b as { sortOrder?: number | null }).sortOrder ?? 0;
    return (orderA ?? 0) - (orderB ?? 0);
  });
  return roots;
}
