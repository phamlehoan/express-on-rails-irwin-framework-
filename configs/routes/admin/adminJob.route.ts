import { Feature } from "@configs/enum";
import { AdminJobController } from "@controllers";
import { Permission } from "@middlewares";
import { action, RailsRoute, RestActions } from "ts-rails";

const JM = Feature.JobManagement;

export class AdminJobRoute extends RailsRoute {
  public draw() {
    this.get("/schedules/new", action(AdminJobController, "newSchedule"), {
      setPermissionForAny: [`${JM}::${Permission.Create}`],
    });
    this.post("/schedules", action(AdminJobController, "createSchedule"), {
      setPermissionForAny: [`${JM}::${Permission.Create}`],
    });
    this.get("/schedules/:jobClass/edit", action(AdminJobController, "editSchedule"), {
      setPermissionForAny: [`${JM}::${Permission.Update}`],
    });
    this.post("/schedules/:jobClass", action(AdminJobController, "updateSchedule"), {
      setPermissionForAny: [`${JM}::${Permission.Update}`],
    });
    this.delete("/schedules/:jobClass", action(AdminJobController, "destroySchedule"), {
      setPermissionForAny: [`${JM}::${Permission.Delete}`],
    });

    this.post(
      "/schedules/:jobClass/pause",
      action(AdminJobController, "pauseSchedule"),
      {
        setPermissionForAny: [`${JM}::${Permission.Update}`],
      },
    );
    this.post(
      "/schedules/:jobClass/resume",
      action(AdminJobController, "resumeSchedule"),
      {
        setPermissionForAny: [`${JM}::${Permission.Update}`],
      },
    );
    this.post(
      "/schedules/:jobClass/run",
      action(AdminJobController, "runSchedule"),
      {
        setPermissionForAny: [`${JM}::${Permission.Update}`],
      },
    );

    this.resource(AdminJobController, {
      only: [RestActions.Index, RestActions.Show, RestActions.Destroy],
      setPermissionFor: JM,
    });

    this.post("/:id/pause", action(AdminJobController, "pause"), {
      setPermissionForAny: [`${JM}::${Permission.Update}`],
    });
    this.post("/:id/resume", action(AdminJobController, "resume"), {
      setPermissionForAny: [`${JM}::${Permission.Update}`],
    });
    this.post("/:id/run", action(AdminJobController, "runNow"), {
      setPermissionForAny: [`${JM}::${Permission.Update}`],
    });
    this.post("/:id/retry", action(AdminJobController, "retry"), {
      setPermissionForAny: [`${JM}::${Permission.Update}`],
    });
  }
}
