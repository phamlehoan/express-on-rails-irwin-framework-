<template>
  <div class="container-fluid">
    <nav aria-label="breadcrumb" class="breadcrumb-sticky">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item">
          <a href="/admin/features">{{ t("admin.feature_management") }}</a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {{ feature.name }}
        </li>
      </ol>
    </nav>

    <div class="card mb-4 content-card">
      <div
        class="card-header d-flex justify-content-between align-items-center"
      >
        <h6 class="mb-0 text-uppercase text-primary fw-bold">
          {{ t("admin.feature_information") }}
        </h6>
        <div class="d-flex gap-2" v-if="canEdit">
          <button
            class="btn btn-sm"
            :class="isEdit ? 'btn-outline-secondary' : 'btn-warning'"
            @click="toggleEdit"
          >
            <i :class="['fa', 'me-1', isEdit ? 'fa-times' : 'fa-edit']"></i>
            {{ isEdit ? t("cancel") : t("edit") }}
          </button>
          <button
            v-if="isEdit"
            class="btn btn-sm btn-primary"
            @click="saveFeature"
          >
            <i class="fa fa-save me-1" aria-hidden="true"></i>
            {{ t("save") }}
          </button>
          <form
            v-if="!isEdit"
            class="d-inline"
            method="post"
            :action="`/admin/features/${feature.id}?_method=DELETE`"
            @submit.prevent="onDeleteSubmit"
          >
            <button class="btn btn-sm btn-danger" type="submit">
              <i class="fa fa-trash me-1" aria-hidden="true"></i>
              {{ t("delete") }}
            </button>
          </form>
        </div>
      </div>
      <div class="card-body">
        <template v-if="!isEdit">
          <div class="row">
            <div class="col-md-3 mb-3">
              <label class="text-muted small">{{ t("admin.code") }}</label>
              <p class="mb-0 fw-semibold">{{ feature.code }}</p>
            </div>
            <div class="col-md-3 mb-3">
              <label class="text-muted small">{{ t("admin.name") }}</label>
              <p class="mb-0 fw-semibold">{{ feature.name }}</p>
            </div>
            <div class="col-md-3 mb-3">
              <label class="text-muted small">{{ t("admin.type") }}</label>
              <p class="mb-0">
                <span
                  class="badge"
                  :class="
                    feature.type === 'MENU_GROUP' ? 'bg-secondary' : 'bg-info'
                  "
                  >{{ feature.type }}</span
                >
              </p>
            </div>
            <div class="col-md-3 mb-3">
              <label class="text-muted small">{{
                t("admin.sort_order")
              }}</label>
              <p class="mb-0 fw-semibold">{{ feature.sortOrder || 0 }}</p>
            </div>
            <div class="col-md-6 mb-3">
              <label class="text-muted small">{{ t("admin.parent") }}</label>
              <p class="mb-0 fw-semibold">{{ parentName }}</p>
            </div>
            <div class="col-12 mb-3" v-if="feature.description">
              <label class="text-muted small">{{
                t("admin.description")
              }}</label>
              <p class="mb-0 text-break">{{ feature.description }}</p>
            </div>
          </div>
        </template>
        <form v-else @submit.prevent="saveFeature">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">{{ t("admin.code") }}</label>
              <input class="form-control" v-model="form.code" required />
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">{{ t("admin.name") }}</label>
              <input class="form-control" v-model="form.name" required />
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">{{ t("admin.type") }}</label>
              <input class="form-control" :value="feature.type" disabled />
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">{{ t("admin.parent") }}</label>
              <select class="form-select" v-model="form.parentId">
                <option value="">{{ t("admin.parent_none") }}</option>
                <option v-for="p in parentOptions" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">{{ t("admin.sort_order") }}</label>
              <input
                class="form-control"
                type="number"
                v-model.number="form.sortOrder"
                min="0"
              />
            </div>
            <div class="col-12 mb-3">
              <label class="form-label">{{ t("admin.description") }}</label>
              <textarea
                class="form-control"
                v-model="form.description"
                rows="2"
              ></textarea>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="card mb-4 content-card">
      <div class="card-header">
        <h6 class="mb-0 text-uppercase text-primary fw-bold">Permissions</h6>
      </div>
      <div class="card-body">
        <ul
          class="list-unstyled mb-0"
          v-if="feature.permissions && feature.permissions.length"
        >
          <li class="mb-1" v-for="p in feature.permissions" :key="p.id">
            <code class="small">{{ p.code }}</code>
          </li>
        </ul>
        <p class="text-muted mb-0" v-else>No permissions</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from "vue";

export default defineComponent({
  name: "FeatureDetail",
  setup() {
    const t = inject<
      (key: string, opts?: Record<string, string | number>) => string
    >("t", (k) => k);
    return { t };
  },
  props: {
    feature: { type: Object as PropType<any>, required: true },
    features: { type: Array as PropType<any[]>, default: () => [] },
  },
  data() {
    const feature = this.feature || {};
    return {
      isEdit: false,
      form: {
        code: feature.code || "",
        name: feature.name || "",
        description: feature.description || "",
        parentId: feature.parentId || "",
        sortOrder: feature.sortOrder || 0,
      },
    };
  },
  computed: {
    canEdit() {
      return this.feature.type !== "FEATURE";
    },
    parentName() {
      if (!this.feature.parentId) return "-";
      const p = this.features.find(
        (f: { id: string }) => f.id === this.feature.parentId,
      );
      return p ? p.name : "-";
    },
    parentOptions() {
      return this.features.filter(
        (f: { id: string }) => f.id !== this.feature.id,
      );
    },
  },
  methods: {
    toggleEdit() {
      this.isEdit = !this.isEdit;
      if (!this.isEdit) {
        this.form = {
          code: this.feature.code,
          name: this.feature.name,
          description: this.feature.description || "",
          parentId: this.feature.parentId || "",
          sortOrder: this.feature.sortOrder || 0,
        };
      }
    },
    saveFeature() {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/admin/features/${this.feature.id}?_method=PUT`;
      ["code", "name", "description", "parentId", "sortOrder"].forEach((k) => {
        const i = document.createElement("input");
        i.name = k;
        i.value =
          k === "sortOrder"
            ? String(this.form.sortOrder)
            : this.form[k as keyof typeof this.form] || "";
        if (k === "parentId" && !this.form.parentId) i.value = "";
        form.appendChild(i);
      });
      document.body.appendChild(form);
      form.submit();
    },
    onDeleteSubmit() {
      if (confirm(this.t("admin.delete_feature_confirm"))) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = `/admin/features/${this.feature.id}?_method=DELETE`;
        document.body.appendChild(form);
        form.submit();
      }
    },
  },
});
</script>
