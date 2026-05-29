import { createHmac, timingSafeEqual } from "node:crypto";

type AppointmentEmailAction = "confirm" | "cancel";

type AppointmentActionPayload = {
  appointmentId: string;
  action: AppointmentEmailAction;
  exp: number;
};

function getSecret() {
  return (
    process.env.APPOINTMENT_ACTION_SECRET ??
    process.env.DOCTOR_DASHBOARD_PIN ??
    "fisionova-demo-action-secret"
  );
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createAppointmentActionToken(
  appointmentId: string,
  action: AppointmentEmailAction,
  ttlMs = 1000 * 60 * 60 * 24 * 7,
) {
  const payload = Buffer.from(
    JSON.stringify({
      appointmentId,
      action,
      exp: Date.now() + ttlMs,
    } satisfies AppointmentActionPayload),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyAppointmentActionToken(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  let parsed: AppointmentActionPayload;

  try {
    parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AppointmentActionPayload;
  } catch {
    return null;
  }

  if (
    !parsed.appointmentId ||
    (parsed.action !== "confirm" && parsed.action !== "cancel") ||
    parsed.exp < Date.now()
  ) {
    return null;
  }

  return parsed;
}
