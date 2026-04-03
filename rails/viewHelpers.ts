import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import fs from "fs";
import path from "path";

dayjs.extend(relativeTime);

/**
 * Global View Helpers - tương tự ActionView::Helpers trong Rails
 */
export const viewHelpers = {
  timeAgo: (date: Date | string | number) => dayjs(date).fromNow(),

  truncate: (str: string, length: number = 30) => {
    if (str.length <= length) return str;
    return str.substring(0, length) + "...";
  },

  numberToCurrency: (amount: number, currency: string = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
    }).format(amount);
  },

  linkTo: (text: string, path: string, options: string = "") => {
    return `<a href="${path}" ${options}>${text}</a>`;
  },

  /**
   * Vite Asset Helper - tương tự javascript_pack_tag trong Rails.
   * Tự động nhận diện file trong manifest.json khi ở production.
   */
  assetPath: (entry: string) => {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      // Ở dev, Vite server thường chạy ở port 5173.
      // Cần đảm bảo entry khớp với đường dẫn gốc của file trong project (ví dụ: main.ts, styles.css)
      return `http://localhost:5173/app/assets/${entry}`;
    }

    try {
      const manifestPath = path.resolve(
        process.cwd(),
        "app/assets/generated/.vite/manifest.json", // Đường dẫn manifest mặc định của Vite
      );
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      // Tìm asset dựa trên entry point gốc (ví dụ: 'javascripts/main.ts' hoặc 'stylesheets/main.css')
      const asset = manifest[`app/assets/${entry}`];
      return asset ? `/generated/${asset.file}` : `/generated/${entry}`; // Fallback nếu không tìm thấy trong manifest
    } catch (e) {
      console.error("[ViteHelper] Manifest not found. Run yarn build-client.");
      return `/generated/${entry}`; // Trả về đường dẫn gốc trong thư mục generated
    }
  },
};
