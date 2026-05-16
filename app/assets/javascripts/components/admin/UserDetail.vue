<template>
  <div class="container-fluid">
    <nav aria-label="breadcrumb" class="breadcrumb-sticky">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item">
          <a :href="breadcrumb.url">{{ breadcrumb.text }}</a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {{ user.email }}
        </li>
      </ol>
    </nav>

    <div class="card mb-4 content-card">
      <div
        class="card-header d-flex justify-content-between align-items-center"
      >
        <h6 class="mb-0 text-uppercase text-primary fw-bold">
          {{ t("admin.personal_information") }}
        </h6>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm"
            :class="isEditPersonal ? 'btn-outline-secondary' : 'btn-warning'"
            @click="toggleEdit('personal')"
          >
            <i
              :class="['fa', 'me-1', isEditPersonal ? 'fa-times' : 'fa-edit']"
            ></i>
            {{ isEditPersonal ? t("cancel") : t("edit") }}
          </button>
          <button
            v-if="isEditPersonal"
            class="btn btn-sm btn-primary"
            @click="saveSection('personal')"
          >
            <i class="fa fa-save me-1" aria-hidden="true"></i>
            {{ t("save") }}
          </button>
        </div>
      </div>
      <div class="card-body">
        <template v-if="!isEditPersonal">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="text-muted small">{{
                t("admin.first_name")
              }}</label>
              <p class="mb-0 fw-semibold">{{ user.firstName }}</p>
            </div>
            <div class="col-md-4 mb-3">
              <label class="text-muted small">{{ t("admin.last_name") }}</label>
              <p class="mb-0 fw-semibold">{{ user.lastName }}</p>
            </div>
            <div class="col-md-4 mb-3">
              <label class="text-muted small">{{ t("admin.email") }}</label>
              <p class="mb-0 fw-semibold">{{ user.email }}</p>
            </div>
            <div class="col-md-4 mb-3">
              <label class="text-muted small">{{ t("admin.status") }}</label>
              <p class="mb-0">
                <span class="badge" :class="statusBadgeClass">{{
                  user.status
                }}</span>
              </p>
            </div>
            <div class="col-md-4 mb-3" v-if="user.phoneNumber">
              <label class="text-muted small">Phone</label>
              <p class="mb-0 fw-semibold">{{ user.phoneNumber }}</p>
            </div>
            <div class="col-12 mb-3" v-if="user.address">
              <label class="text-muted small">Address</label>
              <p class="mb-0">{{ user.address }}</p>
            </div>
          </div>
        </template>
        <form v-else @submit.prevent="saveSection('personal')">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t("admin.first_name") }}</label>
              <input class="form-control" v-model="form.firstName" required />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t("admin.last_name") }}</label>
              <input class="form-control" v-model="form.lastName" required />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t("admin.email") }}</label>
              <input
                class="form-control"
                v-model="form.email"
                type="email"
                required
              />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t("admin.status") }}</label>
              <select class="form-select" v-model="form.status">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t("profile.phone") }}</label>
              <input class="form-control" v-model="form.phoneNumber" />
            </div>
            <div class="col-12 mb-3">
              <label class="form-label">{{ t("profile.address") }}</label>
              <textarea
                class="form-control"
                v-model="form.address"
                rows="2"
              ></textarea>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="card mb-4 content-card">
      <div
        class="card-header d-flex justify-content-between align-items-center"
      >
        <h6 class="mb-0 text-uppercase text-primary fw-bold">Roles</h6>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm"
            :class="isEditRoles ? 'btn-outline-secondary' : 'btn-warning'"
            @click="toggleEdit('roles')"
          >
            <i
              :class="['fa', 'me-1', isEditRoles ? 'fa-times' : 'fa-edit']"
            ></i>
            {{ isEditRoles ? "Cancel" : "Edit" }}
          </button>
          <button
            v-if="isEditRoles"
            class="btn btn-sm btn-primary"
            @click="saveSection('roles')"
          >
            <i class="fa fa-save me-1" aria-hidden="true"></i>
            Save
          </button>
        </div>
      </div>
      <div class="card-body">
        <template v-if="!isEditRoles">
          <div
            class="d-flex flex-wrap gap-2"
            v-if="user.roles && user.roles.length"
          >
            <span
              class="badge bg-primary"
              v-for="ur in user.roles"
              :key="ur.roleId"
            >
              {{ ur.role ? ur.role.name : "" }}
            </span>
          </div>
          <p class="text-muted mb-0" v-else>
            {{ t("admin.no_roles_assigned") }}
          </p>
        </template>
        <template v-else>
          <label class="form-label">{{ t("admin.select_roles") }}</label>
          <div class="dropdown" data-bs-auto-close="outside">
            <button
              class="btn btn-outline-secondary dropdown-toggle w-100 text-start"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {{ rolesSelectedLabel }}
            </button>
            <ul
              class="dropdown-menu p-2"
              style="max-height: 200px; overflow-y: auto"
            >
              <li v-for="r in roles" :key="r.id">
                <label
                  class="dropdown-item d-flex align-items-center cursor-pointer mb-0"
                >
                  <input
                    class="form-check-input me-2"
                    type="checkbox"
                    :value="r.id"
                    v-model="form.roleIds"
                  />
                  <span>{{ r.name }}</span>
                </label>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>

    <div class="card mb-4 content-card">
      <div
        class="card-header d-flex justify-content-between align-items-center"
      >
        <h6 class="mb-0 text-uppercase text-primary fw-bold">
          {{ t("admin.direct_permissions") }}
        </h6>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm"
            :class="isEditPermissions ? 'btn-outline-secondary' : 'btn-warning'"
            @click="toggleEdit('permissions')"
          >
            <i
              :class="[
                'fa',
                'me-1',
                isEditPermissions ? 'fa-times' : 'fa-edit',
              ]"
            ></i>
            {{ isEditPermissions ? t("cancel") : t("edit") }}
          </button>
          <button
            v-if="isEditPermissions"
            class="btn btn-sm btn-primary"
            @click="saveSection('permissions')"
          >
            <i class="fa fa-save me-1" aria-hidden="true"></i>
            {{ t("save") }}
          </button>
        </div>
      </div>
      <div class="card-body">
        <template v-if="!isEditPermissions">
          <div
            v-if="hasMenuGroups && user.permissions && user.permissions.length"
            class="row"
          >
            <div class="col-md-4 border-end pe-md-3 mb-3 mb-md-0">
              <div
                v-for="g in menuGroups"
                :key="g.id"
                class="role-perm-module py-2 px-2 mb-2"
                :class="{
                  'role-perm-module--active':
                    selectedDirectPermViewGroupId === g.id,
                }"
                role="button"
                tabindex="0"
                @click="selectedDirectPermViewGroupId = g.id"
              >
                <span class="small">{{ g.name }}</span>
              </div>
            </div>
            <div class="col-md-8">
              <p
                v-if="viewFeaturesInSelectedGroup.length === 0"
                class="text-muted small mb-0"
              >
                {{ t("admin.perm_no_child_features") }}
              </p>
              <div v-else class="accordion">
                <div
                  class="accordion-item border rounded mb-2"
                  v-for="f in viewFeaturesInSelectedGroup"
                  :key="f.id"
                >
                  <h2 class="accordion-header">
                    <button
                      class="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      :data-bs-target="`#user-view-collapse-${f.id}`"
                    >
                      {{ f.name }}
                    </button>
                  </h2>
                  <div
                    class="accordion-collapse collapse"
                    :id="`user-view-collapse-${f.id}`"
                  >
                    <div class="accordion-body pt-0">
                      <ul class="list-unstyled mb-0">
                        <li
                          v-for="up in userPermsInFeature(f)"
                          :key="up.permissionId"
                        >
                          {{ getPermCode(up) }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="accordion"
            v-else-if="user.permissions && user.permissions.length"
          >
            <div
              class="accordion-item border rounded mb-2"
              v-for="f in featuresWithPerms"
              :key="f.id"
            >
              <h2 class="accordion-header">
                <button
                  class="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  :data-bs-target="`#user-collapse-${f.id}`"
                >
                  {{ f.name }}
                </button>
              </h2>
              <div
                class="accordion-collapse collapse"
                :id="`user-collapse-${f.id}`"
              >
                <div class="accordion-body pt-0">
                  <ul class="list-unstyled mb-0">
                    <li
                      v-for="up in userPermsInFeature(f)"
                      :key="up.permissionId"
                    >
                      {{ getPermCode(up) }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <p class="text-muted mb-0" v-else>
            {{ t("admin.no_direct_permissions") }}
          </p>
        </template>
        <template v-else>
          <p class="small text-muted mb-2">
            {{ t("admin.permissions_outside_role") }}
          </p>
          <div class="form-check form-check-select-all mb-2 pb-2 border-bottom">
            <label class="form-check-label" for="selectAllUserPerms">{{
              t("select_all")
            }}</label>
            <input
              class="form-check-input"
              id="selectAllUserPerms"
              type="checkbox"
              @change="toggleAllPerms"
              :checked="allPermsSelected"
            />
          </div>
          <div v-if="hasMenuGroups" class="row">
            <div class="col-md-4 border-end pe-md-3 mb-3 mb-md-0">
              <div
                v-for="g in menuGroups"
                :key="g.id"
                class="role-perm-module d-flex align-items-center gap-2 py-2 px-2 mb-2"
                :class="{
                  'role-perm-module--active': selectedMenuGroupId === g.id,
                }"
                role="button"
                tabindex="0"
                @click="selectedMenuGroupId = g.id"
              >
                <span @click.stop>
                  <input
                    type="checkbox"
                    class="form-check-input mt-0"
                    :checked="moduleCheckedMenuGroup(g)"
                    @change="onMenuGroupCheck(g, $event)"
                  />
                </span>
                <span class="small">{{ g.name }}</span>
              </div>
            </div>
            <div class="col-md-8">
              <p v-if="!selectedMenuGroupId" class="text-muted small mb-0">
                {{ t("admin.perm_pick_menu_group") }}
              </p>
              <p
                v-else-if="featuresInSelectedGroup.length === 0"
                class="text-muted small mb-0"
              >
                {{ t("admin.perm_no_child_features") }}
              </p>
              <div v-else class="accordion">
                <div
                  class="accordion-item border rounded mb-2"
                  v-for="f in featuresInSelectedGroup"
                  :key="f.id"
                >
                  <h2 class="accordion-header">
                    <button
                      class="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      :data-bs-target="`#edit-collapse-${f.id}`"
                    >
                      {{ f.name }}
                    </button>
                  </h2>
                  <div
                    class="accordion-collapse collapse"
                    :id="`edit-collapse-${f.id}`"
                  >
                    <div class="accordion-body pt-0">
                      <div
                        class="form-check form-check-right"
                        v-for="p in f.permissions"
                        :key="p.id"
                      >
                        <label
                          class="form-check-label"
                          :for="`perm-${p.id}`"
                          >{{ p.code }}</label
                        >
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :value="p.id"
                          v-model="form.permissionIds"
                          :id="`perm-${p.id}`"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="accordion">
            <div
              class="accordion-item border rounded mb-2"
              v-for="f in features"
              :key="f.id"
            >
              <h2 class="accordion-header">
                <button
                  class="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  :data-bs-target="`#edit-collapse-flat-${f.id}`"
                >
                  {{ f.name }}
                </button>
              </h2>
              <div
                class="accordion-collapse collapse"
                :id="`edit-collapse-flat-${f.id}`"
              >
                <div class="accordion-body pt-0">
                  <div
                    class="form-check form-check-right"
                    v-for="p in f.permissions"
                    :key="p.id"
                  >
                    <label class="form-check-label" :for="`perm-flat-${p.id}`">{{
                      p.code
                    }}</label>
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :value="p.id"
                      v-model="form.permissionIds"
                      :id="`perm-flat-${p.id}`"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from "vue";
import { withLocalePath } from "../../i18n";

export default defineComponent({
  name: "UserDetail",
  setup() {
    const t = inject<
      (key: string, opts?: Record<string, string | number>) => string
    >("t", (k) => k);
    return { t };
  },
  props: {
    targetUser: { type: Object as PropType<any>, required: true },
    roles: { type: Array as PropType<any[]>, default: () => [] },
    features: { type: Array as PropType<any[]>, default: () => [] },
    parentBreadcrumb: {
      type: Object as PropType<{ text: string; url: string }>,
      default: () => ({
        text: "sidebar.account_management",
        url: "/admin/users",
      }),
    },
  },
  data() {
    const targetUser = this.targetUser || {};
    return {
      user: {
        ...targetUser,
        roles: targetUser.roles || [],
        permissions: targetUser.permissions || [],
      },
      isEditPersonal: false,
      isEditRoles: false,
      isEditPermissions: false,
      selectedMenuGroupId: "",
      selectedDirectPermViewGroupId: "",
      form: {
        firstName: targetUser.firstName || "",
        lastName: targetUser.lastName || "",
        email: targetUser.email || "",
        status: targetUser.status || "PENDING",
        phoneNumber: targetUser.phoneNumber || "",
        address: targetUser.address || "",
        roleIds: (targetUser.roles || []).map(
          (ur: { roleId: string }) => ur.roleId,
        ),
        permissionIds: (targetUser.permissions || []).map(
          (up: { permissionId: string }) => up.permissionId,
        ),
      },
    };
  },
  computed: {
    featuresWithPerms() {
      return this.features.filter((f: { id: string }) => {
        const perms = (this.user.permissions || []).filter(
          (up: { permission?: { featureId: string } }) =>
            up.permission && up.permission.featureId === f.id,
        );
        return perms.length > 0;
      });
    },
    statusBadgeClass() {
      const s = this.user.status;
      if (s === "ACTIVE") return "bg-success";
      if (s === "INACTIVE") return "bg-danger";
      return "bg-warning";
    },
    menuGroups() {
      return (this.features as { type?: string; sortOrder?: number; code: string }[])
        .filter((f) => f.type === "MENU_GROUP")
        .sort(
          (a, b) =>
            (a.sortOrder || 0) - (b.sortOrder || 0) ||
            String(a.code).localeCompare(String(b.code)),
        );
    },
    hasMenuGroups() {
      return this.menuGroups.length > 0;
    },
    featuresInSelectedGroup() {
      return this.childFeaturesUnderGroup(this.selectedMenuGroupId);
    },
    /** Child features under a menu group that the user has at least one direct permission on. */
    viewFeaturesInSelectedGroup() {
      if (!this.hasMenuGroups) return [];
      const gid =
        this.selectedDirectPermViewGroupId ||
        (this.menuGroups[0] && (this.menuGroups[0] as { id: string }).id) ||
        "";
      return this.childFeaturesUnderGroup(gid).filter(
        (f: { id: string }) => this.userPermsInFeature(f).length > 0,
      );
    },
    visiblePermIdList() {
      const list = this.hasMenuGroups
        ? this.featuresInSelectedGroup
        : this.features;
      const ids: string[] = [];
      for (const f of list as { permissions?: { id: string }[] }[]) {
        for (const p of f.permissions || []) ids.push(p.id);
      }
      return ids;
    },
    allPermsSelected() {
      const vis = this.visiblePermIdList as string[];
      if (!vis.length) return false;
      return vis.every((id: string) => this.form.permissionIds.includes(id));
    },
    rolesSelectedLabel() {
      const n = (this.form.roleIds || []).length;
      return n
        ? this.t("admin.roles_selected", { count: n })
        : this.t("admin.select_roles");
    },
    breadcrumb() {
      return {
        ...this.parentBreadcrumb,
        text: this.t(this.parentBreadcrumb.text),
        url: withLocalePath(this.parentBreadcrumb.url),
      };
    },
  },
  created() {
    this.ensureDirectPermViewGroup();
  },
  methods: {
    ensureDirectPermViewGroup() {
      if (!this.hasMenuGroups || !this.menuGroups.length) return;
      const ok = this.menuGroups.some(
        (g: { id: string }) => g.id === this.selectedDirectPermViewGroupId,
      );
      if (!this.selectedDirectPermViewGroupId || !ok) {
        this.selectedDirectPermViewGroupId = (this.menuGroups[0] as { id: string })
          .id;
      }
    },
    childFeaturesUnderGroup(groupId: string) {
      if (!groupId) return [];
      return (this.features as {
        parentId?: string | null;
        type?: string;
        sortOrder?: number;
        code: string;
      }[])
        .filter(
          (f) => f.parentId === groupId && f.type !== "MENU_GROUP",
        )
        .sort(
          (a, b) =>
            (a.sortOrder || 0) - (b.sortOrder || 0) ||
            String(a.code).localeCompare(String(b.code)),
        );
    },
    toggleEdit(section: string) {
      if (section === "personal") {
        this.isEditPersonal = !this.isEditPersonal;
        if (!this.isEditPersonal) this.resetFormSection("personal");
      } else if (section === "roles") {
        this.isEditRoles = !this.isEditRoles;
        if (!this.isEditRoles) this.resetFormSection("roles");
      } else if (section === "permissions") {
        this.isEditPermissions = !this.isEditPermissions;
        if (!this.isEditPermissions) {
          this.resetFormSection("permissions");
          this.selectedMenuGroupId = "";
        } else if (this.menuGroups.length) {
          this.selectedMenuGroupId = this.menuGroups[0].id;
        }
      }
    },
    resetFormSection(section: string) {
      if (section === "personal") {
        this.form.firstName = this.user.firstName;
        this.form.lastName = this.user.lastName;
        this.form.email = this.user.email;
        this.form.status = this.user.status;
        this.form.phoneNumber = this.user.phoneNumber || "";
        this.form.address = this.user.address || "";
      } else if (section === "roles") {
        this.form.roleIds = (this.user.roles || []).map(
          (ur: { roleId: string }) => ur.roleId,
        );
      } else if (section === "permissions") {
        this.form.permissionIds = (this.user.permissions || []).map(
          (up: { permissionId: string }) => up.permissionId,
        );
      }
    },
    userPermsInFeature(f: { id: string }) {
      return (this.user.permissions || []).filter(
        (up: { permission?: { featureId: string } }) =>
          up.permission && up.permission.featureId === f.id,
      );
    },
    getPermCode(up: { permission?: { code: string } }) {
      return up.permission ? up.permission.code : "";
    },
    getChildrenByParent(): Map<string, { id: string; permissions?: { id: string }[] }[]> {
      const m = new Map<string, { id: string; permissions?: { id: string }[] }[]>();
      for (const f of this.features as { id: string; parentId?: string | null }[]) {
        if (!f.parentId) continue;
        const arr = m.get(f.parentId) || [];
        arr.push(f as { id: string; permissions?: { id: string }[] });
        m.set(f.parentId, arr);
      }
      return m;
    },
    descendantsOfFeature(rootId: string) {
      const m = this.getChildrenByParent();
      const out: { id: string; permissions?: { id: string }[] }[] = [];
      const stack = [...(m.get(rootId) || [])];
      while (stack.length) {
        const f = stack.pop()!;
        out.push(f);
        for (const c of m.get(f.id) || []) stack.push(c);
      }
      return out;
    },
    menuGroupPermIds(g: { id: string }) {
      const ids: string[] = [];
      for (const f of this.descendantsOfFeature(g.id)) {
        for (const p of f.permissions || []) ids.push(p.id);
      }
      return ids;
    },
    moduleCheckedMenuGroup(g: { id: string }) {
      const ids = this.menuGroupPermIds(g);
      return (
        ids.length > 0 && ids.every((id) => this.form.permissionIds.includes(id))
      );
    },
    toggleMenuGroup(g: { id: string }, on: boolean) {
      const ids = this.menuGroupPermIds(g);
      if (on) {
        this.form.permissionIds = [...new Set([...this.form.permissionIds, ...ids])];
      } else {
        this.form.permissionIds = this.form.permissionIds.filter(
          (id: string) => !ids.includes(id),
        );
      }
    },
    onMenuGroupCheck(g: { id: string }, e: Event) {
      const el = e.target as HTMLInputElement;
      this.toggleMenuGroup(g, el.checked);
    },
    toggleAllPerms(e: Event) {
      const checked = (e.target as HTMLInputElement).checked;
      const vis = this.visiblePermIdList as string[];
      if (this.hasMenuGroups) {
        if (checked) {
          this.form.permissionIds = [...new Set([...this.form.permissionIds, ...vis])];
        } else {
          const visSet = new Set(vis);
          this.form.permissionIds = this.form.permissionIds.filter(
            (id: string) => !visSet.has(id),
          );
        }
      } else if (checked) {
        this.form.permissionIds = this.features
          .flatMap(
            (f: { permissions?: { id: string }[] }) => f.permissions || [],
          )
          .map((p: { id: string }) => p.id);
      } else {
        this.form.permissionIds = [];
      }
    },
    saveSection(section: string) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/admin/users/${this.user.id}?_method=PUT`;
      const sectionInput = document.createElement("input");
      sectionInput.name = "section";
      sectionInput.value = section;
      form.appendChild(sectionInput);

      if (section === "personal") {
        [
          ["firstName", this.form.firstName],
          ["lastName", this.form.lastName],
          ["email", this.form.email],
          ["status", this.form.status],
          ["phoneNumber", this.form.phoneNumber],
          ["address", this.form.address],
        ].forEach(([k, v]) => {
          const i = document.createElement("input");
          (i as HTMLInputElement).name = k as string;
          (i as HTMLInputElement).value = (v as string) || "";
          form.appendChild(i);
        });
      } else if (section === "roles") {
        (this.form.roleIds || []).forEach((id: string) => {
          const i = document.createElement("input");
          i.name = "roleIds";
          i.value = id;
          form.appendChild(i);
        });
      } else if (section === "permissions") {
        (this.form.permissionIds || []).forEach((id: string) => {
          const i = document.createElement("input");
          i.name = "permissionIds";
          i.value = id;
          form.appendChild(i);
        });
      }
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
