<template>
  <div class="container-fluid">
    <nav aria-label="breadcrumb" class="breadcrumb-sticky">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item">
          <a href="/admin">{{ t("header.admin") }}</a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {{ t("profile.my_profile") }}
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
        <button
          class="btn btn-sm"
          :class="isEdit ? 'btn-outline-secondary' : 'btn-warning'"
          @click="toggleEdit"
        >
          <i :class="['fa', 'me-1', isEdit ? 'fa-times' : 'fa-edit']"></i>
          {{ isEdit ? t("cancel") : t("edit") }}
        </button>
      </div>

      <div class="card-body">
        <template v-if="!isEdit">
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
            <div class="col-md-4 mb-3" v-if="user.phoneNumber">
              <label class="text-muted small">{{ t("profile.phone") }}</label>
              <p class="mb-0 fw-semibold">{{ user.phoneNumber }}</p>
            </div>
            <div class="col-md-4 mb-3" v-if="user.gender">
              <label class="text-muted small">{{ t("profile.gender") }}</label>
              <p class="mb-0 fw-semibold">{{ user.gender }}</p>
            </div>
            <div class="col-12 mb-3">
              <label class="text-muted small">{{ t("admin.roles") }}</label>
              <div class="d-flex flex-wrap gap-2">
                <span
                  class="badge bg-primary"
                  v-for="ur in user.roles"
                  :key="ur.roleId"
                >
                  {{ ur.role.name }}
                </span>
              </div>
            </div>
            <div class="col-12 mb-3" v-if="user.address">
              <label class="text-muted small">{{ t("profile.address") }}</label>
              <p class="mb-0">{{ user.address }}</p>
            </div>
          </div>
        </template>

        <form v-else @submit.prevent="saveProfile">
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
                :value="user.email"
                type="text"
                disabled
              />
              <small class="text-muted">{{
                t("admin.email_cannot_be_changed")
              }}</small>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t("profile.phone") }}</label>
              <input class="form-control" v-model="form.phoneNumber" />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">{{ t("profile.gender") }}</label>
              <select class="form-select" v-model="form.gender">
                <option value="">-- {{ t("profile.select_gender") }} --</option>
                <option value="male">{{ t("profile.male") }}</option>
                <option value="female">{{ t("profile.female") }}</option>
                <option value="other">{{ t("profile.other") }}</option>
              </select>
            </div>
            <div class="col-12 mb-3">
              <label class="form-label">{{ t("profile.address") }}</label>
              <textarea
                class="form-control"
                v-model="form.address"
                rows="2"
              ></textarea>
            </div>
            <div class="col-12 mb-3">
              <label class="form-label"
                >{{ t("admin.roles") }} (Admin only)</label
              >
              <div class="form-check" v-for="r in roles" :key="r.id">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :value="r.id"
                  v-model="form.roleIds"
                  :id="`adminRole-${r.id}`"
                />
                <label class="form-check-label" :for="`adminRole-${r.id}`">{{
                  r.name
                }}</label>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" type="submit">{{ t("save") }}</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from "vue";

export default defineComponent({
  name: "ProfileDetail",
  setup() {
    const t = inject<
      (key: string, opts?: Record<string, string | number>) => string
    >("t", (k) => k);
    return { t };
  },
  props: {
    currentUser: { type: Object as PropType<any>, required: true },
    roles: { type: Array as PropType<any[]>, default: () => [] },
  },
  data() {
    const user = this.currentUser || {};
    return {
      user: {
        ...user,
        roles: user.roles || [],
      },
      isEdit: false,
      form: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        gender: user.gender || "",
        roleIds: (user.roles || []).map((ur: { roleId: string }) => ur.roleId),
      },
    };
  },
  methods: {
    toggleEdit() {
      this.isEdit = !this.isEdit;
      if (!this.isEdit) this.resetForm();
    },
    resetForm() {
      this.form = {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phoneNumber: this.user.phoneNumber || "",
        address: this.user.address || "",
        gender: this.user.gender || "",
        roleIds: (this.user.roles || []).map(
          (ur: { roleId: string }) => ur.roleId,
        ),
      };
    },
    saveProfile() {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/admin/me?_method=PUT";

      [
        ["firstName", this.form.firstName],
        ["lastName", this.form.lastName],
        ["phoneNumber", this.form.phoneNumber],
        ["address", this.form.address],
        ["gender", this.form.gender],
      ].forEach(([k, v]) => {
        const i = document.createElement("input");
        i.name = k as string;
        i.value = (v as string) || "";
        form.appendChild(i);
      });

      (this.form.roleIds || []).forEach((id: string) => {
        const i = document.createElement("input");
        i.name = "roleIds";
        i.value = id;
        form.appendChild(i);
      });

      document.body.appendChild(form);
      form.submit();
    },
  },
});
</script>
