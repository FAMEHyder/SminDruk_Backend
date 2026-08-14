import axios from "axios";

/**
 * Contract for future SMM providers. Implementations must never return API keys
 * or raw credentials to callers. The dummy adapter deliberately performs no
 * external fulfilment; it lets the marketplace operate safely in manual mode.
 */
class SmmProviderAdapter {
  async getServices() { throw new Error("getServices() must be implemented by a provider adapter."); }
  async createOrder() { throw new Error("createOrder() must be implemented by a provider adapter."); }
  async getOrderStatus() { throw new Error("getOrderStatus() must be implemented by a provider adapter."); }
  async getBalance() { throw new Error("getBalance() must be implemented by a provider adapter."); }
  async requestRefill() { throw new Error("requestRefill() must be implemented by a provider adapter."); }
  async getRefillStatus() { throw new Error("getRefillStatus() must be implemented by a provider adapter."); }
  async cancelOrder() { throw new Error("cancelOrder() must be implemented by a provider adapter."); }
}

class DummySmmProviderAdapter extends SmmProviderAdapter {
  async getServices() { return []; }
  async getBalance() { return { available: 0, currency: "USD", mode: "dummy" }; }
  async createOrder() { return { accepted: false, mode: "manual", message: "Provider integration is not configured." }; }
  async getOrderStatus() { return { status: "pending", mode: "manual" }; }
  async requestRefill() { return { accepted: false, mode: "manual" }; }
  async getRefillStatus() { return { status: "unavailable", mode: "manual" }; }
  async cancelOrder() { return { accepted: false, mode: "manual" }; }
}

class SmmZioProviderAdapter extends SmmProviderAdapter {
  constructor() {
    super();
    this.apiKey = process.env.SMMZIO_API_KEY || process.env.SMMZIO_KEY;
    this.baseUrl = (process.env.SMMZIO_API_URL || "https://smmzio.com/api/v2").replace(/\/+$/, "");
    this.timeout = Number(process.env.SMM_PROVIDER_TIMEOUT_MS || 20_000);
  }

  ensureConfigured() {
    if (!this.apiKey) throw new Error("SMMZIO_API_KEY is not configured.");
  }

  async request(action, payload = {}) {
    this.ensureConfigured();
    const { data } = await axios.post(
      this.baseUrl,
      new URLSearchParams({ key: this.apiKey, action, ...Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, String(value)])) }),
      { timeout: this.timeout, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    if (data?.error) throw new Error(String(data.error));
    return data;
  }

  getServices() { return this.request("services"); }
  getBalance() { return this.request("balance"); }
  createOrder({ service, link, quantity, ...optional }) { return this.request("add", { service, link, quantity, ...optional }); }
  getOrderStatus(order) { return this.request("status", { order }); }
  requestRefill(order) { return this.request("refill", { order }); }
  getRefillStatus(refill) { return this.request("refill_status", { refill }); }
  cancelOrder(order) { return this.request("cancel", { orders: order }); }
}

const getSmmProviderAdapter = () => {
  if ((process.env.SMM_PROVIDER_MODE || "").trim().toLowerCase() === "smmzio") {
    return new SmmZioProviderAdapter();
  }
  return new DummySmmProviderAdapter();
};

export { SmmProviderAdapter, DummySmmProviderAdapter, SmmZioProviderAdapter, getSmmProviderAdapter };
