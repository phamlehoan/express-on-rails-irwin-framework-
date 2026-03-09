<template>
  <div class="container-fluid">
    <nav aria-label="breadcrumb" class="breadcrumb-sticky">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item">
          <a href="/admin/users">{{ t('sidebar.account_management') }}</a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">{{ user.email }}</li>
      </ol>
    </nav>

    <div class="card mb-4 content-card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0 text-uppercase text-primary fw-bold">{{ t('admin.personal_information') }}</h6>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm"
            :class="isEditPersonal ? 'btn-outline-secondary' : 'btn-warning'"
            @click="toggleEdit('personal')"
          >
            <i :class="['fa', 'me-1', isEditPersonal ? 'fa-times' : 'fa-edit']"></i>
            {{ isEditPersonal ? t('cancel') : t('edit') }}
          </button>
          <button
            v-if="isEditPersonal"
            class="btn btn-sm btn-primary"
            @click="saveSection('personal')"
          >
            <i class="fa fa-save me-1" aria-hidden="true"></i>
            {{ t('save') }}
          </button>
        </div>
      </div>
      <div class="card-body">
        <template v-if="!isEditPersonal">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="text-muted small">{{ t('admin.first_name') }}</label>
              <p class="mb-0 fw-semibold">{{ user.firstName }}</p>
            </div>
            <div class="col-md-4 mb-3">
              <label class="text-muted small">{{ t('admin.last_name') }}</label>
              <p class="mb-0 fw-semibold">{{ user.lastName }}</p>
            </div>
            <div class="col-md-4 mb-3">
              <label class="text-muted small">{{ t('admin.email') }}</label>
              <p class="mb-0 fw-semibold">{{ user.email }}</p>
            </div>
            <div class="col-md-4 mb-3">
              <label class="text-muted small">{{ t('admin.status') }}</label>
              <p class="mb-0">
                <span class="badge" :class="statusBadgeClass">{{ user.status }}</span>
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
              <label class="form-label">{{ t('admin.first_name') }}</label>
              <input class="form-control" v-model="form.firstName" required />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t('admin.last_name') }}</label>
              <input class="form-control" v-model="form.lastName" required />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t('admin.email') }}</label>
              <input class="form-control" v-model="form.email" type="email" required />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t('admin.status') }}</label>
              <select class="form-select" v-model="form.status">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t('profile.phone') }}</label>
              <input class="form-control" v-model="form.phoneNumber" />
            </div>
            <div class="col-12 mb-3">
              <label class="form-label">{{ t('profile.address') }}</label>
              <textarea class="form-control" v-model="form.address" rows="2"></textarea>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="card mb-4 content-card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0 text-uppercase text-primary fw-bold">Roles</h6>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm"
            :class="isEditRoles ? 'btn-outline-secondary' : 'btn-warning'"
            @click="toggleEdit('roles')"
          >
            <i :class="['fa', 'me-1', isEditRoles ? 'fa-times' : 'fa-edit']"></i>
            {{ isEditRoles ? 'Cancel' : 'Edit' }}
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
          <div class="d-flex flex-wrap gap-2" v-if="user.roles && user.roles.length">
            <span class="badge bg-primary" v-for="ur in user.roles" :key="ur.roleId">
              {{ ur.role ? ur.role.name : '' }}
            </span>
          </div>
          <p class="text-muted mb-0" v-else>{{ t('admin.no_roles_assigned') }}</p>
        </template>
        <template v-else>
          <label class="form-label">{{ t('admin.select_roles') }}</label>
          <div class="dropdown" data-bs-auto-close="outside">
            <button
              class="btn btn-outline-secondary dropdown-toggle w-100 text-start"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {{ rolesSelectedLabel }}
            </button>
            <ul class="dropdown-menu p-2" style="max-height: 200px; overflow-y: auto">
              <li v-for="r in roles" :key="r.id">
                <label class="dropdown-item d-flex align-items-center cursor-pointer mb-0">
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
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0 text-uppercase text-primary fw-bold">{{ t('admin.direct_permissions') }}</h6>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm"
            :class="isEditPermissions ? 'btn-outline-secondary' : 'btn-warning'"
            @click="toggleEdit('permissions')"
          >
            <i :class="['fa', 'me-1', isEditPermissions ? 'fa-times' : 'fa-edit']"></i>
            {{ isEditPermissions ? t('cancel') : t('edit') }}
          </button>
          <button
            v-if="isEditPermissions"
            class="btn btn-sm btn-primary"
            @click="saveSection('permissions')"
          >
            <i class="fa fa-save me-1" aria-hidden="true"></i>
            {{ t('save') }}
          </button>
        </div>
      </div>
      <div class="card-body">
        <template v-if="!isEditPermissions">
          <div class="accordion" v-if="user.permissions && user.permissions.length">
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
              <div class="accordion-collapse collapse" :id="`user-collapse-${f.id}`">
                <div class="accordion-body pt-0">
                  <ul class="list-unstyled mb-0">
                    <li v-for="up in userPermsInFeature(f)" :key="up.permissionId">
                      {{ getPermCode(up) }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <p class="text-muted mb-0" v-else>{{ t('admin.no_direct_permissions') }}</p>
        </template>
        <template v-else>
          <p class="small text-muted mb-2">{{ t('admin.permissions_outside_role') }}</p>
          <div class="form-check form-check-select-all mb-2 pb-2 border-bottom">
            <label class="form-check-label" for="selectAllUserPerms">{{ t('select_all') }}</label>
            <input
              class="form-check-input"
              id="selectAllUserPerms"
              type="checkbox"
              @change="toggleAllPerms"
              :checked="allPermsSelected"
            />
          </div>
          <div class="accordion">
            <div class="accordion-item border rounded mb-2" v-for="f in features" :key="f.id">
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
              <div class="accordion-collapse collapse" :id="`edit-collapse-${f.id}`">
                <div class="accordion-body pt-0">
                  <div class="form-check form-check-right" v-for="p in f.permissions" :key="p.id">
                    <label class="form-check-label" :for="`perm-${p.id}`">{{ p.code }}</label>
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
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';

export default defineComponent({
  name: 'UserDetail',
  setup() {
    const t = inject<(key: string, opts?: Record<string, string | number>) => string>('t', (k) => k);
    return { t };
  },
  props: {
    targetUser: { type: Object, required: true },
    roles: { type: Array, default: () => [] },
    features: { type: Array, default: () => [] },
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
      form: {
        firstName: targetUser.firstName || '',
        lastName: targetUser.lastName || '',
        email: targetUser.email || '',
        status: targetUser.status || 'PENDING',
        phoneNumber: targetUser.phoneNumber || '',
        address: targetUser.address || '',
        roleIds: (targetUser.roles || []).map((ur: { roleId: string }) => ur.roleId),
        permissionIds: (targetUser.permissions || []).map((up: { permissionId: string }) => up.permissionId),
      },
    };
  },
  computed: {
    featuresWithPerms() {
      return this.features.filter((f: { id: string }) => {
        const perms = (this.user.permissions || []).filter(
          (up: { permission?: { featureId: string } }) => up.permission && up.permission.featureId === f.id
        );
        return perms.length > 0;
      });
    },
    statusBadgeClass() {
      const s = this.user.status;
      if (s === 'ACTIVE') return 'bg-success';
      if (s === 'INACTIVE') return 'bg-danger';
      return 'bg-warning';
    },
    allPermsSelected() {
      const all = this.features.flatMap((f: { permissions?: { id: string }[] }) => f.permissions || []).map((p: { id: string }) => p.id);
      return all.length > 0 && this.form.permissionIds.length === all.length;
    },
    rolesSelectedLabel() {
      const n = (this.form.roleIds || []).length;
      return n ? this.t('admin.roles_selected', { count: n }) : this.t('admin.select_roles');
    },
  },
  methods: {
    toggleEdit(section: string) {
      if (section === 'personal') {
        this.isEditPersonal = !this.isEditPersonal;
        if (!this.isEditPersonal) this.resetFormSection('personal');
      } else if (section === 'roles') {
        this.isEditRoles = !this.isEditRoles;
        if (!this.isEditRoles) this.resetFormSection('roles');
      } else if (section === 'permissions') {
        this.isEditPermissions = !this.isEditPermissions;
        if (!this.isEditPermissions) this.resetFormSection('permissions');
      }
    },
    resetFormSection(section: string) {
      if (section === 'personal') {
        this.form.firstName = this.user.firstName;
        this.form.lastName = this.user.lastName;
        this.form.email = this.user.email;
        this.form.status = this.user.status;
        this.form.phoneNumber = this.user.phoneNumber || '';
        this.form.address = this.user.address || '';
      } else if (section === 'roles') {
        this.form.roleIds = (this.user.roles || []).map((ur: { roleId: string }) => ur.roleId);
      } else if (section === 'permissions') {
        this.form.permissionIds = (this.user.permissions || []).map((up: { permissionId: string }) => up.permissionId);
      }
    },
    userPermsInFeature(f: { id: string }) {
      return (this.user.permissions || []).filter(
        (up: { permission?: { featureId: string } }) => up.permission && up.permission.featureId === f.id
      );
    },
    getPermCode(up: { permission?: { code: string } }) {
      return up.permission ? up.permission.code : '';
    },
    toggleAllPerms(e: Event) {
      const checked = (e.target as HTMLInputElement).checked;
      if (checked) {
        this.form.permissionIds = this.features
          .flatMap((f: { permissions?: { id: string }[] }) => f.permissions || [])
          .map((p: { id: string }) => p.id);
      } else {
        this.form.permissionIds = [];
      }
    },
    saveSection(section: string) {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/admin/users/${this.user.id}?_method=PUT`;
      const sectionInput = document.createElement('input');
      sectionInput.name = 'section';
      sectionInput.value = section;
      form.appendChild(sectionInput);

      if (section === 'personal') {
        [
          ['firstName', this.form.firstName],
          ['lastName', this.form.lastName],
          ['email', this.form.email],
          ['status', this.form.status],
          ['phoneNumber', this.form.phoneNumber],
          ['address', this.form.address],
        ].forEach(([k, v]) => {
          const i = document.createElement('input');
          (i as HTMLInputElement).name = k as string;
          (i as HTMLInputElement).value = (v as string) || '';
          form.appendChild(i);
        });
      } else if (section === 'roles') {
        (this.form.roleIds || []).forEach((id: string) => {
          const i = document.createElement('input');
          i.name = 'roleIds';
          i.value = id;
          form.appendChild(i);
        });
      } else if (section === 'permissions') {
        (this.form.permissionIds || []).forEach((id: string) => {
          const i = document.createElement('input');
          i.name = 'permissionIds';
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
