import { z } from "zod";

const finiteNullableNumber = z
  .number()
  .finite()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export function sanitizeLabel(label: string): string {
  return label.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
}

export const locationUpdateSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  accuracy: z.number().finite().min(0).max(100000).nullable().optional().default(null),
  altitude: finiteNullableNumber,
  heading: z.number().finite().min(0).max(360).nullable().optional().transform((value) => value ?? null),
  speed: z.number().finite().min(0).max(400).nullable().optional().transform((value) => value ?? null),
  batteryLevel: z.number().int().min(0).max(100).nullable().optional().default(null),
  isCharging: z.boolean().nullable().optional().default(null)
});

export const createKeySchema = z.object({
  keyLabel: z.string().min(1).max(100).transform(sanitizeLabel).pipe(z.string().min(1).max(80)),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((value) => (value ? new Date(value) : null))
});

export const updateKeySchema = z
  .object({
    keyLabel: z.string().min(1).max(100).transform(sanitizeLabel).pipe(z.string().min(1).max(80)).optional(),
    isActive: z.boolean().optional(),
    isMuted: z.boolean().optional(),
    expiresAt: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .transform((value) => (value ? new Date(value) : value === null ? null : undefined))
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be supplied.");

export const joinConnectionSchema = z.object({
  shareToken: z.string().min(20).max(256)
});

export const settingsUpdateSchema = z
  .object({
    globalGhostMode: z.boolean().optional(),
    shareBattery: z.boolean().optional(),
    allowLocationHistory: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one setting must be supplied.");

export const registerSchema = z.object({
  name: z
    .string()
    .max(100)
    .optional()
    .transform((value) => (value ? sanitizeLabel(value) : null)),
  email: z.string().email().max(255).transform((value) => value.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be 128 characters or fewer.")
});

export const credentialsSchema = z.object({
  email: z.string().email().max(255).transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1).max(128)
});

export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type CreateKeyInput = z.infer<typeof createKeySchema>;
export type UpdateKeyInput = z.infer<typeof updateKeySchema>;
export type JoinConnectionInput = z.infer<typeof joinConnectionSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
