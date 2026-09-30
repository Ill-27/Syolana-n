export class API {
  constructor() {
    this.online = false;
    this.me = null;
    this.csrf = "";
    this.settings = {};
  }
  async request(path, { method = "GET", body } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (method !== "GET" && this.csrf) headers["X-CSRF-Token"] = this.csrf;
    const res = await fetch("api/" + path, {
      method,
      credentials: "same-origin",
      headers,
      signal: AbortSignal.timeout(20000),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw Error(
        "Сервер кабинетов не подключён. Здесь доступен просмотр сайта.",
      );
    }
    if (!res.ok) throw Error(data.error || "Не удалось выполнить запрос");
    return data;
  }
  async init() {
    try {
      const s = await this.request("status");
      this.online = s.service === "syolana";
      this.settings = s;
      await this.session();
    } catch {
      this.online = false;
    }
    return this;
  }
  async session() {
    const x = await this.request("session");
    this.me = x.user;
    this.csrf = x.csrf || "";
    return x;
  }
  async auth(action, values) {
    const x = await this.request("auth/" + action, {
      method: "POST",
      body: values,
    });
    this.me = x.user;
    this.csrf = x.csrf;
    return x;
  }
  async upload(file) {
    if (!file) return null;
    const max = 20 * 1024 * 1024;
    if (file.size > max)
      throw Error("Максимальный размер файла в пилоте — 20 МБ.");
    const data = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    return this.request("assets", {
      method: "POST",
      body: { name: file.name, data },
    });
  }
}
