import { FlashType } from "@configs/enum";
import env from "@configs/env";
import { runJobByClass } from "@lib/jobs/jobRunner";
import {
  createJobSchedule,
  deleteJobSchedule,
  getJobSchedule,
  isCronTaskRunning,
  listJobSchedules,
  listJobSchedulesPaginated,
  listRegisteredJobClassNames,
  listRegisteredJobsForAdmin,
  setJobSchedulePaused,
  updateJobSchedule,
} from "@lib/jobs/jobSchedule";
import {
  cancelQueueJob,
  listActiveJobs,
  parseJobArgs,
  pauseQueueJob,
  resumeQueueJob,
  retryFailedJob,
  runQueueJobNow,
} from "@lib/jobs/jobStore";
import { JobQueue } from "@lib/jobs/types";
import { BullMQJobAdapter, getJobAdapter } from "@lib/utils/jobs";
import models from "@models";
import { NotFoundError } from "ts-rails";
import { AdminController } from "./admin.controller";

function parsePaused(body: Record<string, unknown>): boolean {
  return body.paused === "1" || body.paused === true || body.paused === "on";
}

const DEFAULT_SCHEDULE_PER_PAGE = 10;
const DEFAULT_REGISTERED_PER_PAGE = 10;
const DEFAULT_QUEUE_PER_PAGE = 10;

function parsePageParam(raw: unknown): number {
  return Math.max(1, parseInt(String(raw || "1"), 10) || 1);
}

function parsePerPageParam(raw: unknown, fallback: number): number {
  return Math.min(50, Math.max(10, parseInt(String(raw || fallback), 10) || fallback));
}

function safePage(page: number, total: number, perPage: number): number {
  const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / perPage));
  return Math.min(Math.max(1, page), totalPages);
}

export class AdminJobController extends AdminController {
  async index() {
    const search = String(this.req.query.search || "").trim();
    const status = String(this.req.query.status || "");
    const queue = String(this.req.query.queue || "");

    const schedulePageRaw = parsePageParam(this.req.query.schedulePage);
    const schedulePerPage = parsePerPageParam(
      this.req.query.schedulePerPage,
      DEFAULT_SCHEDULE_PER_PAGE,
    );
    const registeredPageRaw = parsePageParam(this.req.query.registeredPage);
    const registeredPerPage = parsePerPageParam(
      this.req.query.registeredPerPage,
      DEFAULT_REGISTERED_PER_PAGE,
    );
    const pageRaw = parsePageParam(this.req.query.page);
    const perPage = parsePerPageParam(this.req.query.perPage, DEFAULT_QUEUE_PER_PAGE);

    const [scheduleFirst, allRegistered, queueFirst] = await Promise.all([
      listJobSchedulesPaginated({
        page: schedulePageRaw,
        perPage: schedulePerPage,
      }),
      listRegisteredJobsForAdmin(),
      listActiveJobs({
        page: pageRaw,
        perPage,
        status: status as
          | ""
          | "pending"
          | "processing"
          | "failed"
          | "paused",
        search,
        queue,
      }),
    ]);

    const scheduleTotal = scheduleFirst.total;
    const schedulePage = safePage(schedulePageRaw, scheduleTotal, schedulePerPage);
    let schedules = scheduleFirst.items;
    if (schedulePage !== schedulePageRaw) {
      schedules = (
        await listJobSchedulesPaginated({
          page: schedulePage,
          perPage: schedulePerPage,
        })
      ).items;
    }

    const registeredTotal = allRegistered.length;
    const registeredPage = safePage(
      registeredPageRaw,
      registeredTotal,
      registeredPerPage,
    );
    const registeredJobs = allRegistered.slice(
      (registeredPage - 1) * registeredPerPage,
      registeredPage * registeredPerPage,
    );

    const total = queueFirst.total;
    const page = safePage(pageRaw, total, perPage);
    let jobs = queueFirst.items;
    if (page !== pageRaw) {
      jobs = (
        await listActiveJobs({
          page,
          perPage,
          status: status as
            | ""
            | "pending"
            | "processing"
            | "failed"
            | "paused",
          search,
          queue,
        })
      ).items;
    }

    const buildQueryString = () => {
      const q: Record<string, string> = {};
      if (search) q.search = search;
      if (status) q.status = status;
      if (queue) q.queue = queue;
      if (schedulePage > 1) q.schedulePage = String(schedulePage);
      if (schedulePerPage !== DEFAULT_SCHEDULE_PER_PAGE) {
        q.schedulePerPage = String(schedulePerPage);
      }
      if (registeredPage > 1) q.registeredPage = String(registeredPage);
      if (registeredPerPage !== DEFAULT_REGISTERED_PER_PAGE) {
        q.registeredPerPage = String(registeredPerPage);
      }
      if (page > 1) q.page = String(page);
      if (perPage !== DEFAULT_QUEUE_PER_PAGE) q.perPage = String(perPage);
      const s = new URLSearchParams(q).toString();
      return s ? "&" + s : "";
    };

    this.render("admin/job.view/index", {
      schedules,
      scheduleTotal,
      schedulePage,
      schedulePerPage,
      registeredJobs,
      registeredTotal,
      registeredPage,
      registeredPerPage,
      jobs,
      total,
      page,
      perPage,
      search,
      status,
      queue,
      buildQueryString,
      jobsUseRedis: env.jobsUseRedis,
      isCronRunning: (jobClass: string) => isCronTaskRunning(jobClass),
    });
  }

  async newSchedule() {
    const schedules = await listJobSchedules();
    const scheduled = new Set(schedules.map((s) => s.jobClass));
    const availableJobClasses = listRegisteredJobClassNames().filter(
      (name) => !scheduled.has(name),
    );

    this.render("admin/job.view/scheduleForm", {
      formTitle: this.t("admin.new_schedule"),
      formHint: this.t("admin.schedule_form_hint"),
      formAction: "/admin/jobs/schedules",
      isEdit: false,
      availableJobClasses,
      selectedJobClass: "",
      cronValue: "",
      pausedChecked: false,
      submitLabel: this.t("admin.add_schedule"),
    });
  }

  async createSchedule() {
    const jobClass = String(this.req.body.jobClass || "").trim();
    const cron = String(this.req.body.cron || "").trim();
    const paused = parsePaused(this.req.body);

    try {
      await createJobSchedule(jobClass, cron, paused);
      this.flash(FlashType.Success, this.t("admin.schedule_created"));
      this.redirect("/admin/jobs");
    } catch (error) {
      this.flash(FlashType.Errors, {
        msg: error instanceof Error ? error.message : this.t("admin.schedule_save_failed"),
      });
      this.redirect("/admin/jobs/schedules/new");
    }
  }

  async editSchedule() {
    const jobClass = decodeURIComponent(this.req.params.jobClass);
    const schedule = await getJobSchedule(jobClass);
    if (!schedule) throw new NotFoundError("Schedule not found");

    this.render("admin/job.view/scheduleForm", {
      formTitle: this.t("admin.edit_schedule"),
      formHint: null,
      formAction: `/admin/jobs/schedules/${encodeURIComponent(jobClass)}`,
      isEdit: true,
      schedule,
      availableJobClasses: [],
      selectedJobClass: jobClass,
      cronValue: schedule.cron,
      pausedChecked: schedule.paused,
      submitLabel: this.t("admin.save_schedule"),
    });
  }

  async updateSchedule() {
    const jobClass = decodeURIComponent(this.req.params.jobClass);
    const cron = String(this.req.body.cron || "").trim();
    const paused = parsePaused(this.req.body);

    try {
      await updateJobSchedule(jobClass, cron, paused);
      this.flash(FlashType.Success, this.t("admin.schedule_updated"));
      this.redirect("/admin/jobs");
    } catch (error) {
      this.flash(FlashType.Errors, {
        msg: error instanceof Error ? error.message : this.t("admin.schedule_save_failed"),
      });
      this.redirect(`/admin/jobs/schedules/${encodeURIComponent(jobClass)}/edit`);
    }
  }

  async destroySchedule() {
    const jobClass = decodeURIComponent(this.req.params.jobClass);
    try {
      await deleteJobSchedule(jobClass);
      this.flash(FlashType.Success, this.t("admin.schedule_deleted"));
    } catch (error) {
      this.flash(FlashType.Errors, {
        msg: error instanceof Error ? error.message : this.t("admin.schedule_delete_failed"),
      });
    }
    this.redirect("/admin/jobs");
  }

  async show() {
    const job = await models.backgroundJob.findUnique({
      where: { id: this.req.params.id },
    });
    if (!job) throw new NotFoundError("Job not found");

    this.render("admin/job.view/show", {
      job,
      parsedArgs: parseJobArgs(job.args),
    });
  }

  async pauseSchedule() {
    const jobClass = decodeURIComponent(this.req.params.jobClass);
    await setJobSchedulePaused(jobClass, true);
    this.flash(FlashType.Success, this.t("admin.schedule_paused"));
    this.redirect("/admin/jobs");
  }

  async resumeSchedule() {
    const jobClass = decodeURIComponent(this.req.params.jobClass);
    await setJobSchedulePaused(jobClass, false);
    this.flash(FlashType.Success, this.t("admin.schedule_resumed"));
    this.redirect("/admin/jobs");
  }

  async runSchedule() {
    const jobClass = decodeURIComponent(this.req.params.jobClass);
    try {
      await runJobByClass(jobClass, []);
      this.flash(FlashType.Success, this.t("admin.schedule_ran"));
    } catch (error) {
      this.flash(FlashType.Errors, {
        msg:
          error instanceof Error ? error.message : this.t("admin.schedule_run_failed"),
      });
    }
    this.redirect("/admin/jobs");
  }

  async pause() {
    const job = await models.backgroundJob.findUnique({
      where: { id: this.req.params.id },
    });
    if (!job) throw new NotFoundError("Job not found");

    const { count } = await pauseQueueJob(job.id);
    if (count === 0) {
      this.flash(FlashType.Errors, { msg: this.t("admin.job_pause_not_allowed") });
    } else {
      this.flash(FlashType.Success, this.t("admin.job_paused"));
    }
    this.redirect(`/admin/jobs/${job.id}`);
  }

  async resume() {
    const job = await models.backgroundJob.findUnique({
      where: { id: this.req.params.id },
    });
    if (!job) throw new NotFoundError("Job not found");

    const { count } = await resumeQueueJob(job.id);
    if (count === 0) {
      this.flash(FlashType.Errors, { msg: this.t("admin.job_resume_not_allowed") });
    } else {
      this.flash(FlashType.Success, this.t("admin.job_resumed"));
      const { scheduleDatabaseJobProcessing } = await import(
        "@lib/jobs/databaseWorker"
      );
      scheduleDatabaseJobProcessing();
    }
    this.redirect(`/admin/jobs/${job.id}`);
  }

  async runNow() {
    const job = await models.backgroundJob.findUnique({
      where: { id: this.req.params.id },
    });
    if (!job) throw new NotFoundError("Job not found");

    const count = await runQueueJobNow(job.id);
    if (count === 0) {
      this.flash(FlashType.Errors, { msg: this.t("admin.job_run_not_allowed") });
      this.redirect(`/admin/jobs/${job.id}`);
      return;
    }

    if (job.queue === JobQueue.Bullmq && env.jobsUseRedis) {
      const adapter = getJobAdapter();
      if (adapter instanceof BullMQJobAdapter) {
        await adapter.enqueueRecord(
          job.id,
          job.jobClass,
          parseJobArgs(job.args),
        );
      }
    } else {
      const { scheduleDatabaseJobProcessing } = await import(
        "@lib/jobs/databaseWorker"
      );
      scheduleDatabaseJobProcessing();
    }

    this.flash(FlashType.Success, this.t("admin.job_queued_now"));
    this.redirect(`/admin/jobs/${job.id}`);
  }

  async retry() {
    const job = await models.backgroundJob.findUnique({
      where: { id: this.req.params.id },
    });
    if (!job) throw new NotFoundError("Job not found");

    await retryFailedJob(job.id);
    const args = parseJobArgs(job.args);

    if (job.queue === JobQueue.Bullmq && env.jobsUseRedis) {
      const adapter = getJobAdapter();
      if (adapter instanceof BullMQJobAdapter) {
        await adapter.enqueueRecord(job.id, job.jobClass, args);
      }
    } else {
      const { scheduleDatabaseJobProcessing } = await import(
        "@lib/jobs/databaseWorker"
      );
      scheduleDatabaseJobProcessing();
    }

    this.flash(FlashType.Success, this.t("admin.job_retried"));
    this.redirect(`/admin/jobs/${job.id}`);
  }

  async destroy() {
    const job = await models.backgroundJob.findUnique({
      where: { id: this.req.params.id },
    });
    if (!job) throw new NotFoundError("Job not found");

    if (job.status === "processing") {
      this.flash(FlashType.Errors, { msg: this.t("admin.job_cancel_processing_hint") });
      this.redirect(`/admin/jobs/${job.id}`);
      return;
    }

    const { count } = await cancelQueueJob(job.id);
    if (count === 0) {
      await models.backgroundJob.delete({ where: { id: job.id } });
    }
    this.flash(FlashType.Success, this.t("admin.job_deleted"));
    this.redirect("/admin/jobs");
  }
}
