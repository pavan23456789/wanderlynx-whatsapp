import * as fs from "fs/promises";
import * as path from "path";
import type { Template } from "./data";

const TEMPLATES_FILE_PATH = path.join(
  process.cwd(),
  "logs",
  "templates.json"
);

type TemplateStore = {
  templates: Template[];
};

/**
 * Ensure template file exists and load it
 */
async function getStore(): Promise<TemplateStore> {
  try {
    await fs.mkdir(path.dirname(TEMPLATES_FILE_PATH), {
      recursive: true,
    });

    const data = await fs.readFile(TEMPLATES_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      const initialTemplates: Template[] = [
        {
          id: "TPL001",
          name: "welcome_message",
          category: "Marketing",
          content:
            "Hello {{1}}! Welcome to Wanderlynx. How can we help you plan your next adventure?",
          status: "Approved",
        },
        {
          id: "TPL002",
          name: "trip_reminder",
          category: "Utility",
          content:
            "Hi {{1}}, This is a reminder about your upcoming trip {{2}}. The trip is scheduled to start at {{3}}. Please ensure you arrive at the pickup point on time. Have a great trip!",
          status: "Approved",
        },
      ];

      const defaultStore: TemplateStore = {
        templates: initialTemplates,
      };

      await fs.writeFile(
        TEMPLATES_FILE_PATH,
        JSON.stringify(defaultStore, null, 2)
      );

      return defaultStore;
    }

    console.error(
      "[TemplateStore] Failed to read templates:",
      error
    );
    return { templates: [] };
  }
}

/**
 * Save template store
 */
async function writeStore(store: TemplateStore): Promise<void> {
  try {
    await fs.writeFile(
      TEMPLATES_FILE_PATH,
      JSON.stringify(store, null, 2)
    );
  } catch (error) {
    console.error(
      "[TemplateStore] Failed to write templates:",
      error
    );
  }
}

/**
 * Get all templates
 */
export async function getTemplates(): Promise<Template[]> {
  const store = await getStore();
  return store.templates;
}

/**
 * Save all templates
 */
export async function saveTemplates(
  templates: Template[]
): Promise<void> {
  await writeStore({ templates });
}

/**
 * 🔥 IMPORTANT PART 🔥
 * Render a template with params → human readable text
 */
export async function renderTemplateByName(
  templateName: string,
  params: string[]
): Promise<string> {
  const store = await getStore();

  const template = store.templates.find(
    (t) => t.name === templateName
  );

  if (!template) {
    // fallback so UI never breaks
    return `${templateName}: ${params.join(" ")}`;
  }

  let rendered = template.content;

  params.forEach((value, index) => {
    rendered = rendered.replace(
      `{{${index + 1}}}`,
      value
    );
  });

  return rendered;
}
