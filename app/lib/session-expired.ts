export class SessionExpiredError extends Error {
  constructor(message = "Sessão expirada.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export function redirectToExpiredLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.href = "/login?expired=1";
}

/** Lança SessionExpiredError se a resposta indicar sessão expirada (401). */
export function assertSessionActive(response: Response): void {
  if (response.status === 401) {
    throw new SessionExpiredError();
  }
}
