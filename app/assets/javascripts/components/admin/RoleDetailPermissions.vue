<template>
  <div class="card mb-4 content-card role-detail-permissions">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span class="text-uppercase text-primary fw-bold">{{
        t("admin.permission_information")
      }}</span>
      <button
        type="button"
        class="btn btn-sm btn-primary"
        :disabled="isReadOnly"
        @click="submitPermissions"
      >
        <i class="fa fa-check me-1" aria-hidden="true"></i>
        {{ t("admin.apply_permissions") }}
      </button>
    </div>
    <div class="card-body">
      <template v-if="hasMenuGroups">
        <div class="row">
          <div class="col-md-4 border-end pe-md-4">
            <h6 class="small text-uppercase text-muted mb-2">
              {{ t("admin.modules_list") }}
            </h6>
            <p class="small text-muted mb-2">{{ t("admin.modules_list_hint") }}</p>
            <div class="form-check form-check-select-all mb-2 pb-2 border-bottom">
              <label class="form-check-label" for="roleSelectAllModules">{{
                t("select_all")
              }}</label>
              <input
                id="roleSelectAllModules"
                ref="selectAllModulesEl"
                class="form-check-input"
                type="checkbox"
                :checked="allModulesSelected"
                :disabled="isReadOnly"
                @change="onSelectAllModules"
              />
            </div>
            <div
              v-for="g in menuGroups"
              :key="g.id"
              class="role-perm-module d-flex align-items-center gap-2 py-2 px-2 mb-2"
              :class="{ 'role-perm-module--active': selectedMenuGroupId === g.id }"
              role="button"
              tabindex="0"
              @click="selectedMenuGroupId = g.id"
            >
              <span class="d-inline-flex align-items-center" @click.stop>
                <input
                  class="form-check-input flex-shrink-0 mt-0"
                  type="checkbox"
                  :checked="moduleCheckedMenuGroup(g)"
                  :disabled="isReadOnly"
                  @change="onMenuGroupCheck(g, $event)"
                />
              </span>
              <span class="small flex-grow-1">{{ g.name }}</span>
            </div>
          </div>
          <div class="col-md-8">
            <h6 class="small text-uppercase text-muted mb-2">
              {{ t("admin.functions_components") }}
            </h6>
            <p class="small text-muted mb-2">
              {{ t("admin.role_perm_functions_intro") }}
            </p>
            <div class="form-check form-check-select-all mb-2 pb-2 border-bottom">
              <label class="form-check-label" for="roleSelectAllPerms">{{
                t("select_all")
              }}</label>
              <input
                id="roleSelectAllPerms"
                ref="selectAllPermsEl"
                class="form-check-input"
                type="checkbox"
                :checked="allPermsInPanelSelected"
                :disabled="!selectedMenuGroupId || isReadOnly"
                @change="onSelectAllPerms"
              />
            </div>
            <p v-if="!selectedMenuGroupId" class="text-muted small mb-0">
              {{ t("admin.perm_pick_menu_group") }}
            </p>
            <p
              v-else-if="featuresInSelectedGroup.length === 0"
              class="text-muted small mb-0"
            >
              {{ t("admin.perm_no_child_features") }}
            </p>
            <div v-else class="accordion" :key="selectedMenuGroupId">
              <div
                v-for="f in featuresInSelectedGroup"
                :key="f.id"
                class="accordion-item border rounded mb-2"
              >
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#rp-collapse-${f.id}`"
                  >
                    {{ f.name }}
                  </button>
                </h2>
                <div
                  class="accordion-collapse collapse"
                  :id="`rp-collapse-${f.id}`"
                >
                  <div class="accordion-body pt-0">
                    <div
                      v-for="p in f.permissions || []"
                      :key="p.id"
                      class="form-check form-check-right"
                    >
                      <label class="form-check-label" :for="`rp-perm-${p.id}`">{{
                        p.code
                      }}</label>
                      <input
                        :id="`rp-perm-${p.id}`"
                        class="form-check-input"
                        type="checkbox"
                        :checked="permissionIds.includes(p.id)"
                        :disabled="isReadOnly"
                        @change="togglePerm(p.id, ($event.target as HTMLInputElement).checked)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="row">
          <div class="col-md-4 border-end pe-md-4">
            <h6 class="small text-uppercase text-muted mb-2">
              {{ t("admin.modules_list") }}
            </h6>
            <p class="small text-muted mb-2">{{ t("admin.modules_list_hint") }}</p>
            <div class="form-check form-check-select-all mb-2 pb-2 border-bottom">
              <label class="form-check-label" for="roleLegacySelectAllModules">{{
                t("select_all")
              }}</label>
              <input
                id="roleLegacySelectAllModules"
                ref="legacySelectAllModulesEl"
                class="form-check-input"
                type="checkbox"
                :checked="allLegacyModulesSelected"
                :disabled="isReadOnly"
                @change="onLegacySelectAllModules"
              />
            </div>
            <div
              v-for="f in features"
              :key="'mod-' + f.id"
              class="form-check py-2 border-bottom form-check-right d-flex align-items-center justify-content-between gap-2"
            >
              <label class="form-check-label mb-0" :for="`rpmod-${f.id}`">{{
                f.name
              }}</label>
              <input
                :id="`rpmod-${f.id}`"
                class="form-check-input flex-shrink-0"
                type="checkbox"
                :checked="moduleCheckedFeature(f)"
                :disabled="isReadOnly"
                @change="onLegacyModuleCheck(f, $event)"
              />
            </div>
          </div>
          <div class="col-md-8">
            <h6 class="small text-uppercase text-muted mb-2">
              {{ t("admin.functions_components") }}
            </h6>
            <p class="small text-muted mb-2">
              {{ t("admin.functions_components_hint") }}
            </p>
            <div class="form-check form-check-select-all mb-2 pb-2 border-bottom">
              <label class="form-check-label" for="roleLegacySelectAllPerms">{{
                t("select_all")
              }}</label>
              <input
                id="roleLegacySelectAllPerms"
                ref="legacySelectAllPermsEl"
                class="form-check-input"
                type="checkbox"
                :checked="allLegacyPermsSelected"
                :disabled="isReadOnly"
                @change="onLegacySelectAllPerms"
              />
            </div>
            <div class="accordion">
              <div
                v-for="f in features"
                :key="'acc-' + f.id"
                class="accordion-item border rounded mb-2"
              >
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#rp-legacy-collapse-${f.id}`"
                  >
                    {{ f.name }}
                  </button>
                </h2>
                <div
                  class="accordion-collapse collapse"
                  :id="`rp-legacy-collapse-${f.id}`"
                >
                  <div class="accordion-body pt-0">
                    <div
                      v-for="p in f.permissions || []"
                      :key="p.id"
                      class="form-check form-check-right"
                    >
                      <label class="form-check-label" :for="`rp-leg-${p.id}`">{{
                        p.code
                      }}</label>
                      <input
                        :id="`rp-leg-${p.id}`"
                        class="form-check-input"
                        type="checkbox"
                        :checked="permissionIds.includes(p.id)"
                        :disabled="isReadOnly"
                        @change="togglePerm(p.id, ($event.target as HTMLInputElement).checked)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, nextTick } from "vue";

type Feature = {
  id: string;
  code: string;
  name: string;
  type?: string;
  parentId?: string | null;
  sortOrder?: number;
  permissions?: { id: string; code: string }[];
};

export default defineComponent({
  name: "RoleDetailPermissions",
  props: {
    formAction: { type: String, required: true },
    features: { type: Array as PropType<Feature[]>, default: () => [] },
    initialPermissionIds: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    isReadOnly: { type: Boolean, default: false },
  },
  setup() {
    const t = inject<
      (key: string, opts?: Record<string, string | number>) => string
    >("t", (k) => k);
    return { t };
  },
  data() {
    return {
      permissionIds: [...(this.initialPermissionIds || [])] as string[],
      selectedMenuGroupId: "" as string,
    };
  },
  computed: {
    menuGroups(): Feature[] {
      return (this.features || [])
        .filter((f) => f.type === "MENU_GROUP")
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            String(a.code).localeCompare(String(b.code)),
        );
    },
    hasMenuGroups(): boolean {
      return this.menuGroups.length > 0;
    },
    featuresInSelectedGroup(): Feature[] {
      if (!this.selectedMenuGroupId) return [];
      return this.childFeaturesUnderGroup(this.selectedMenuGroupId);
    },
    visiblePermIdsInPanel(): string[] {
      const list = this.hasMenuGroups
        ? this.featuresInSelectedGroup
        : this.features;
      const ids: string[] = [];
      for (const f of list) {
        for (const p of f.permissions || []) ids.push(p.id);
      }
      return ids;
    },
    allPermsInPanelSelected(): boolean {
      const vis = this.visiblePermIdsInPanel;
      return (
        vis.length > 0 && vis.every((id) => this.permissionIds.includes(id))
      );
    },
    allModulesSelected(): boolean {
      if (this.hasMenuGroups) {
        const groups = this.menuGroups.filter(
          (g) => this.menuGroupPermIds(g).length > 0,
        );
        if (groups.length === 0) return false;
        return groups.every((g) => this.moduleCheckedMenuGroup(g));
      }
      const mods = this.features.filter((f) => this.featurePermIds(f).length > 0);
      if (mods.length === 0) return false;
      return mods.every((f) => this.moduleCheckedFeature(f));
    },
    someModulesSelected(): boolean {
      if (this.hasMenuGroups) {
        return this.menuGroups.some((g) => {
          const ids = this.menuGroupPermIds(g);
          if (ids.length === 0) return false;
          const hasSome = ids.some((id) => this.permissionIds.includes(id));
          const hasAll = ids.every((id) => this.permissionIds.includes(id));
          return hasSome && !hasAll;
        });
      }
      return this.features.some((f) => {
        const ids = this.featurePermIds(f);
        if (ids.length === 0) return false;
        return (
          ids.some((id) => this.permissionIds.includes(id)) &&
          !this.moduleCheckedFeature(f)
        );
      });
    },
    allLegacyPermsSelected(): boolean {
      const all = this.allLegacyPermissionIds;
      return (
        all.length > 0 && all.every((id) => this.permissionIds.includes(id))
      );
    },
    allLegacyModulesSelected(): boolean {
      const mods = this.features.filter((f) => this.featurePermIds(f).length > 0);
      if (mods.length === 0) return false;
      return mods.every((f) => this.moduleCheckedFeature(f));
    },
    allLegacyPermissionIds(): string[] {
      const ids: string[] = [];
      for (const f of this.features) {
        for (const p of f.permissions || []) ids.push(p.id);
      }
      return ids;
    },
  },
  watch: {
    permissionIds: {
      deep: true,
      handler() {
        void this.syncCheckboxIndeterminates();
      },
    },
    selectedMenuGroupId() {
      void this.syncCheckboxIndeterminates();
    },
    hasMenuGroups: {
      immediate: true,
      handler(v: boolean) {
        if (v && this.menuGroups.length && !this.selectedMenuGroupId) {
          this.selectedMenuGroupId = this.menuGroups[0].id;
        }
      },
    },
  },
  mounted() {
    void this.syncCheckboxIndeterminates();
  },
  methods: {
    childFeaturesUnderGroup(groupId: string): Feature[] {
      if (!groupId) return [];
      return (this.features || [])
        .filter(
          (f) => f.parentId === groupId && f.type !== "MENU_GROUP",
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            String(a.code).localeCompare(String(b.code)),
        );
    },
    getChildrenByParent(): Map<string, Feature[]> {
      const m = new Map<string, Feature[]>();
      for (const f of this.features || []) {
        if (!f.parentId) continue;
        const arr = m.get(f.parentId) || [];
        arr.push(f);
        m.set(f.parentId, arr);
      }
      return m;
    },
    descendantsOfFeature(rootId: string): Feature[] {
      const m = this.getChildrenByParent();
      const out: Feature[] = [];
      const stack = [...(m.get(rootId) || [])];
      while (stack.length) {
        const f = stack.pop()!;
        out.push(f);
        for (const c of m.get(f.id) || []) stack.push(c);
      }
      return out;
    },
    menuGroupPermIds(g: Feature): string[] {
      const ids: string[] = [];
      for (const f of this.descendantsOfFeature(g.id)) {
        for (const p of f.permissions || []) ids.push(p.id);
      }
      return ids;
    },
    featurePermIds(f: Feature): string[] {
      return (f.permissions || []).map((p) => p.id);
    },
    allManagedMenuPermIds(): string[] {
      const s = new Set<string>();
      for (const g of this.menuGroups) {
        for (const id of this.menuGroupPermIds(g)) s.add(id);
      }
      return [...s];
    },
    moduleCheckedMenuGroup(g: Feature): boolean {
      const ids = this.menuGroupPermIds(g);
      return (
        ids.length > 0 && ids.every((id) => this.permissionIds.includes(id))
      );
    },
    moduleCheckedFeature(f: Feature): boolean {
      const ids = this.featurePermIds(f);
      return (
        ids.length > 0 && ids.every((id) => this.permissionIds.includes(id))
      );
    },
    togglePerm(id: string, on: boolean) {
      if (this.isReadOnly) return;
      if (on) {
        if (!this.permissionIds.includes(id)) this.permissionIds.push(id);
      } else {
        this.permissionIds = this.permissionIds.filter((x) => x !== id);
      }
    },
    onMenuGroupCheck(g: Feature, e: Event) {
      const on = (e.target as HTMLInputElement).checked;
      const ids = this.menuGroupPermIds(g);
      if (on) {
        this.permissionIds = [...new Set([...this.permissionIds, ...ids])];
      } else {
        this.permissionIds = this.permissionIds.filter((x) => !ids.includes(x));
      }
    },
    onSelectAllModules(e: Event) {
      if (this.isReadOnly) return;
      const on = (e.target as HTMLInputElement).checked;
      const managed = this.hasMenuGroups
        ? this.allManagedMenuPermIds()
        : this.allLegacyPermissionIds;
      const set = new Set(managed);
      if (on) {
        this.permissionIds = [...new Set([...this.permissionIds, ...managed])];
      } else {
        this.permissionIds = this.permissionIds.filter((id) => !set.has(id));
      }
    },
    onSelectAllPerms(e: Event) {
      if (this.isReadOnly) return;
      const on = (e.target as HTMLInputElement).checked;
      const vis = this.visiblePermIdsInPanel;
      const set = new Set(vis);
      if (on) {
        this.permissionIds = [...new Set([...this.permissionIds, ...vis])];
      } else {
        this.permissionIds = this.permissionIds.filter((id) => !set.has(id));
      }
    },
    onLegacySelectAllModules(e: Event) {
      this.onSelectAllModules(e);
    },
    onLegacySelectAllPerms(e: Event) {
      if (this.isReadOnly) return;
      const on = (e.target as HTMLInputElement).checked;
      const all = this.allLegacyPermissionIds;
      if (on) {
        this.permissionIds = [...all];
      } else {
        this.permissionIds = [];
      }
    },
    onLegacyModuleCheck(f: Feature, e: Event) {
      const on = (e.target as HTMLInputElement).checked;
      const ids = this.featurePermIds(f);
      if (on) {
        this.permissionIds = [...new Set([...this.permissionIds, ...ids])];
      } else {
        this.permissionIds = this.permissionIds.filter((x) => !ids.includes(x));
      }
    },
    async syncCheckboxIndeterminates() {
      await nextTick();
      const m = this.$refs.selectAllModulesEl as HTMLInputElement | undefined;
      if (m) {
        m.indeterminate = this.someModulesSelected && !this.allModulesSelected;
      }
      const p = this.$refs.selectAllPermsEl as HTMLInputElement | undefined;
      if (p && this.hasMenuGroups) {
        const vis = this.visiblePermIdsInPanel;
        const c = vis.filter((id) => this.permissionIds.includes(id)).length;
        p.indeterminate = c > 0 && c < vis.length;
      }
      const lm = this.$refs.legacySelectAllModulesEl as HTMLInputElement | undefined;
      if (lm && !this.hasMenuGroups) {
        lm.indeterminate =
          this.someModulesSelected && !this.allLegacyModulesSelected;
      }
      const lp = this.$refs.legacySelectAllPermsEl as HTMLInputElement | undefined;
      if (lp && !this.hasMenuGroups) {
        const all = this.allLegacyPermissionIds;
        const c = all.filter((id) => this.permissionIds.includes(id)).length;
        lp.indeterminate = c > 0 && c < all.length;
      }
    },
    submitPermissions() {
      if (this.isReadOnly) return;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = this.formAction;
      this.permissionIds.forEach((id) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "permissionIds";
        input.value = id;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    },
  },
});
</script>

<style scoped>
.role-perm-module {
  cursor: pointer;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 0.375rem;
  background: #fff;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}
.role-perm-module:hover {
  background: #f8f9fa;
}
.role-perm-module--active {
  background: #eef5fc;
  border-color: #9ec5fe;
  box-shadow: inset 3px 0 0 #6ea8fe;
}
.role-perm-module--active .small {
  color: #052c65;
  font-weight: 600;
}
</style>
