import z from "zod";

const envSchema = z.object({
  VITE_AUTH0_AUDIENCE: z.string(),
  VITE_AUTH0_CLIENT_ID: z.string(),
  VITE_AUTH0_DOMAIN: z.string(),
  VITE_AUTO_CLEAR_UPDATE_INTERVAL_MINUTES: z.coerce.number().default(5),
  VITE_SERVER_URL: z.string().default("http://localhost:4001/"),
  VITE_SNACKBAR_AUTOHIDE_DURATION: z.coerce.number().default(6000),
});

export const ENV = envSchema.parse(import.meta.env);
