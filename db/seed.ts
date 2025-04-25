import models from "@models";

async function seed() {
  const taskFeature = await models.feature.create({
    data: {
      code: "TASK",
      name: "Task Management",
      description: "Manage tasks in the system",
      type: "FEATURE",
    },
  });
  const taskTypeFeature = await models.feature.create({
    data: {
      code: "TASK_TYPE",
      name: "Task Type Management",
      description: "Manage task types in the system",
      type: "FEATURE",
    },
  });
  const taskPermissions = await Promise.all([
    models.permission.create({
      data: {
        code: "TASK::READ",
        name: "Read Task",
        description: "Permission to read tasks",
        type: "FEATURE",
        featureId: taskFeature.id,
      },
    }),
    models.permission.create({
      data: {
        code: "TASK::CREATE",
        name: "Create Task",
        description: "Permission to create tasks",
        type: "FEATURE",
        featureId: taskFeature.id,
      },
    }),
    models.permission.create({
      data: {
        code: "TASK::UPDATE",
        name: "Update Task",
        description: "Permission to update tasks",
        type: "FEATURE",
        featureId: taskFeature.id,
      },
    }),
    models.permission.create({
      data: {
        code: "TASK::DELETE",
        name: "Delete Task",
        description: "Permission to delete tasks",
        type: "FEATURE",
        featureId: taskFeature.id,
      },
    }),
  ]);
  const taskTypePermissions = await Promise.all([
    models.permission.create({
      data: {
        code: "TASK_TYPE::READ",
        name: "Read Task Type",
        description: "Permission to read task types",
        type: "FEATURE",
        featureId: taskTypeFeature.id,
      },
    }),
    models.permission.create({
      data: {
        code: "TASK_TYPE::CREATE",
        name: "Create Task Type",
        description: "Permission to create task types",
        type: "FEATURE",
        featureId: taskTypeFeature.id,
      },
    }),
    models.permission.create({
      data: {
        code: "TASK_TYPE::UPDATE",
        name: "Update Task Type",
        description: "Permission to update task types",
        type: "FEATURE",
        featureId: taskTypeFeature.id,
      },
    }),
    models.permission.create({
      data: {
        code: "TASK_TYPE::DELETE",
        name: "Delete Task Type",
        description: "Permission to delete task types",
        type: "FEATURE",
        featureId: taskTypeFeature.id,
      },
    }),
  ]);
  const managerRole = await models.role.create({
    data: {
      code: "MANAGER",
      name: "Manager",
      description: "Manager role with full access to tasks and task types",
      isReadOnly: false,
    },
  });
  const workerRole = await models.role.create({
    data: {
      code: "WORKER",
      name: "Worker",
      description: "Worker role with limited access to tasks",
      isReadOnly: false,
    },
  });
  await models.roleToPermission.createMany({
    data: [
      ...taskPermissions.map((perm) => ({
        roleId: managerRole.id,
        permissionId: perm.id,
      })),
      ...taskTypePermissions.map((perm) => ({
        roleId: managerRole.id,
        permissionId: perm.id,
      })),
      {
        roleId: workerRole.id,
        permissionId: taskPermissions.find((p) => p.code === "TASK::READ")!.id,
      },
      {
        roleId: workerRole.id,
        permissionId: taskPermissions.find((p) => p.code === "TASK::UPDATE")!
          .id,
      },
    ],
  });
  console.log("Seed data created successfully!");
}
seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await models.$disconnect();
  });
