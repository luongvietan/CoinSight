import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  // Cấu hình replay để ghi lại lỗi người dùng
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
