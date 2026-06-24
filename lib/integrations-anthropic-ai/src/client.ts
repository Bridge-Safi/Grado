import Anthropic from "@anthropic-ai/sdk";

function createClient(): Anthropic {
  const replitKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const replitBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const directKey = process.env.ANTHROPIC_API_KEY;

  if (replitKey && replitBase) {
    return new Anthropic({ apiKey: replitKey, baseURL: replitBase });
  }

  if (directKey) {
    return new Anthropic({ apiKey: directKey });
  }

  throw new Error(
    "Anthropic API key manquante. Configure ANTHROPIC_API_KEY dans les variables d'environnement Railway."
  );
}

let _client: Anthropic | null = null;

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    if (!_client) {
      _client = createClient();
    }
    const value = (_client as any)[prop];
    return typeof value === "function" ? value.bind(_client) : value;
  },
});
