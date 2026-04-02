import path from "path";
import repl from "repl";
import { RailsApplication } from "../railsApplication";

// Đánh dấu đang chạy trong môi trường console để chặn cron jobs
process.env.IRWIN_CONSOLE = "true";

// 1. Tạm thời chặn logs để output khởi động sạch sẽ
const originalLog = console.log;
const originalInfo = console.info;
console.log = () => {};
console.info = () => {};

const getApplication = () => {
  const root = process.cwd();
  const potentialPaths = [
    process.env.APP_PATH,
    path.join(root, "configs/application"),
    path.join(root, "src/configs/application"),
    path.join(root, "index"),
    path.join(root, "app"),
    path.join(root, "src/app"),
  ].filter(Boolean) as string[];

  for (const appPath of potentialPaths) {
    try {
      const mod = require(appPath);
      const app = mod.default || mod;
      if (app instanceof RailsApplication) return app;
    } catch (err) {
      continue;
    }
  }
  return null;
};

const getModels = () => {
  const root = process.cwd();
  const modelPaths = [
    path.join(root, "app/models"),
    path.join(root, "src/app/models"),
    path.join(root, "models"),
    path.join(root, "src/models"),
  ];
  for (const p of modelPaths) {
    try {
      const mod = require(p);
      return mod.default || mod;
    } catch {}
  }
  return null;
};

const startConsole = async () => {
  const app = getApplication();
  if (!app) {
    originalLog("[Error] Could not find RailsApplication instance.");
    process.exit(1);
  }

  // Khởi tạo các services (Database, i18n...) nhưng không chạy startServer()
  await (app as any).initialize();

  // Khôi phục lại console
  console.log = originalLog;
  console.info = originalInfo;

  console.info("\n-------------------------------------------");
  console.info("  RAILS CONSOLE");
  console.info("-------------------------------------------");
  console.info("- 'app'    : The Application instance");
  console.info("- 'models' : Your database models");
  console.info("-------------------------------------------\n");

  const r = repl.start({
    prompt: "\x1b[35mrails > \x1b[0m",
    useGlobal: true,
  });

  // Thiết lập lưu lịch sử câu lệnh (giống Rails console)
  const historyFile = path.join(process.cwd(), ".rails_console_history");
  if (typeof (r as any).setupHistory === "function") {
    (r as any).setupHistory(historyFile, (err: any) => {
      if (err) originalLog("[Warning] Could not setup console history");
    });
  }

  // Đưa các tài nguyên vào ngữ cảnh của REPL
  r.context.app = app;
  r.context.models = getModels();

  r.on("exit", () => process.exit());
};

startConsole();
