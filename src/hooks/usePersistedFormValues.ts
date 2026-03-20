import { useEffect } from 'preact/hooks';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { ZodType } from 'zod';

const STORAGE_KEY = 'export_form';

function pick<T extends Record<string, any>>(obj: T, keys: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function usePersistedFormValues<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  persistedFields: (keyof T)[],
  schema?: ZodType<T>,
) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const picked = pick(parsed, persistedFields);
        if (schema) {
          const result = schema.safeParse({ ...form.getValues(), ...picked });
          if (result.success) {
            form.reset(result.data as T);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          form.reset({ ...form.getValues(), ...picked } as T);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted form values:', e);
    }
  }, []);

  const values = useWatch({ control: form.control });

  useEffect(() => {
    try {
      const toSave = pick(values as T, persistedFields);
      if (schema) {
        const result = schema.safeParse({ ...schema.parse({}), ...toSave });
        if (!result.success) {
          return;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to persist form values:', e);
    }
  }, [values]);
}
