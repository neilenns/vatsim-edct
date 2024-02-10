import z from "zod";

const envSchema = z.object({
  VITE_SERVER_URL: z.string().default("http://localhost:4001/"),
  VITE_API_KEY: z.string(),
  VITE_SNACKBAR_AUTOHIDE_DURATION: z.coerce.number().default(6000),
  VITE_AUTO_CLEAR_UPDATE_INTERVAL_MINUTES: z.coerce.number().default(5),
});

export const ENV = envSchema.parse(import.meta.env);
