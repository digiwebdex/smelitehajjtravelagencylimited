(function () {
  const ADMIN_EMAILS = new Set(["asomoalamin@yahoo.com"]);

  function removeShortcut() {
    const ids = ["frontend-cms-shortcut", "frontend-cms-sidebar-shortcut"];
    ids.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  function readSession() {
    try {
      const raw = localStorage.getItem("smelite_vps_session");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isAdminSession() {
    const session = readSession();
    const user = session && session.user ? session.user : null;
    const email = String(user && user.email ? user.email : "").trim().toLowerCase();
    const role = String(user && user.role ? user.role : "").trim().toLowerCase();

    return role === "admin" || ADMIN_EMAILS.has(email);
  }

  function shouldShowShortcut() {
    if (!location.pathname.startsWith("/admin")) return false;
    if (location.pathname.startsWith("/admin-frontend-cms")) return false;
    return isAdminSession();
  }

  function addShortcut() {
    if (!shouldShowShortcut()) {
      removeShortcut();
      return;
    }

    if (!document.getElementById("frontend-cms-shortcut")) {
      const link = document.createElement("a");
      link.id = "frontend-cms-shortcut";
      link.href = "/admin-frontend-cms.html";
      link.textContent = "Frontend CMS";
      link.style.position = "fixed";
      link.style.right = "22px";
      link.style.bottom = "22px";
      link.style.zIndex = "99999";
      link.style.background = "#0f5f43";
      link.style.color = "#fff";
      link.style.padding = "12px 16px";
      link.style.borderRadius = "14px";
      link.style.fontWeight = "800";
      link.style.boxShadow = "0 14px 30px rgba(0,0,0,.22)";
      link.style.textDecoration = "none";
      link.style.fontFamily = "Inter, system-ui, sans-serif";
      document.body.appendChild(link);
    }
  }

  setInterval(addShortcut, 1000);
  document.addEventListener("DOMContentLoaded", addShortcut);
  window.addEventListener("storage", addShortcut);
})();
