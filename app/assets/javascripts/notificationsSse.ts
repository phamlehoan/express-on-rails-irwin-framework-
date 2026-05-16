import { withLocalePath } from "./i18n";

type NotificationDto = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: { link?: string } | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsCenterPayload = {
  notifications: NotificationDto[];
  unreadCount: number;
  generatedAt?: string;
};

const MAX_DROPDOWN_ROWS = 18;

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case "success":
      return "bg-success";
    case "warning":
      return "bg-warning text-dark";
    case "error":
      return "bg-danger";
    case "system":
      return "bg-dark";
    default:
      return "bg-secondary";
  }
}

function renderList(
  container: HTMLElement,
  items: NotificationDto[],
  maxRows: number,
): void {
  const emptyMsg = container.getAttribute("data-msg-empty") || "—";
  const newLabel = container.getAttribute("data-label-new") || "New";
  const slice = items.slice(0, maxRows);
  if (slice.length === 0) {
    container.innerHTML = `<div class="dropdown-item text-muted small py-2 px-3">${escHtml(emptyMsg)}</div>`;
    return;
  }
  container.innerHTML = slice
    .map((n) => {
      const unread = !n.readAt;
      const fw = unread ? "fw-semibold" : "";
      const dt = escHtml(new Date(n.createdAt).toLocaleString());
      const typ = escHtml(n.type);
      const title = escHtml(n.title);
      const msg = n.message ? escHtml(n.message.slice(0, 200)) : "";
      const link = n.data?.link ? String(n.data.link) : "";
      const newBadge = unread
        ? ` <span class="badge bg-info text-dark">${escHtml(newLabel)}</span>`
        : "";
      return `<button type="button" class="border-0 bg-transparent w-100 text-start alerts-center-row px-3 py-2 ${fw}" data-notification-id="${n.id.replace(/"/g, "")}" data-alert-href="${link.replace(/"/g, "")}"><div class="small text-muted">${dt}</div><div class="mb-1"><span class="badge ${typeBadgeClass(n.type)} me-1">${typ}</span>${newBadge}</div><div class="small text-break">${title}${msg ? ` — ${msg}` : ""}</div></button>`;
    })
    .join("");
}

export function initNotificationsSse(): void {
  const bell = document.getElementById("notificationsDropdown");
  const badge = document.getElementById("notificationsUnreadBadge");
  const list = document.getElementById("notificationsCenterList");
  if (!bell || !badge || !list) return;

  const bellEl = bell as HTMLElement;
  const badgeEl = badge as HTMLElement;
  const listEl = list as HTMLElement;

  if (typeof EventSource === "undefined") return;

  const ssePath = bellEl.getAttribute("data-sse-path") || "/notifications/stream";

  function applyPayload(p: NotificationsCenterPayload): void {
    const n = p.unreadCount;
    if (n > 0) {
      badgeEl.textContent = n > 99 ? "99+" : String(n);
      badgeEl.classList.remove("d-none");
    } else {
      badgeEl.textContent = "0";
      badgeEl.classList.add("d-none");
    }
    renderList(listEl, p.notifications || [], MAX_DROPDOWN_ROWS);
  }

  listEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-notification-id]",
    );
    if (!btn) return;
    const id = btn.getAttribute("data-notification-id");
    const href = btn.getAttribute("data-alert-href");
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    const url = `/notifications/${encodeURIComponent(id)}/read`;
    if (href) {
      void fetch(url, { method: "POST", credentials: "include" }).finally(() => {
        window.location.href = withLocalePath(href);
      });
    } else {
      void fetch(url, { method: "POST", credentials: "include" });
    }
  });

  const markAll = document.getElementById("notificationsMarkAllRead");
  markAll?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    void fetch("/notifications/read-all", {
      method: "POST",
      credentials: "include",
    });
  });

  const es = new EventSource(ssePath, { withCredentials: true });
  es.addEventListener("snapshot", (ev) => {
    try {
      const p = JSON.parse((ev as MessageEvent).data) as NotificationsCenterPayload;
      applyPayload(p);
    } catch {
      /* ignore */
    }
  });
  es.onerror = () => {
    /* keepalive / reconnect */
  };
}
