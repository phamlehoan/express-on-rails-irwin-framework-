import { FlashType } from "@configs/enum";
import { ExampleJob } from "@jobs";
import { enqueueJob } from "@lib/jobs/enqueueJob";
import { ApplicationController } from ".";

const DEV_QUEUE_DELAY_MS = 60_000;

export class DevController extends ApplicationController {
  async index() {
    this.render("dev.view/index", { user: this.currentUser });
  }

  async create() {
    this.flash(FlashType.Success, { msg: this.t("flash.created") });
    this.redirect("/dev");
  }

  /** Enqueue ExampleJob qua hàng đợi (performLater) — chỉ route dev. */
  async enqueueExampleJobPerformLater() {
    const runAt = new Date(Date.now() + DEV_QUEUE_DELAY_MS);
    const { id } = await enqueueJob(ExampleJob, ["dev"], { runAt });
    this.flash(FlashType.Success, {
      msg: `ExampleJob đã xếp hàng (id: ${id.slice(0, 8)}…, chạy ~1 phút). Active queue xóa bản ghi khi job xong.`,
    });
    this.redirect("/admin/jobs");
  }
}
