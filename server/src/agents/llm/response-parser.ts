/**
 * Extracts a JSON action object from LLM raw output.
 * Handles: bare JSON, markdown code fences, text-wrapped JSON.
 */
export function parseActionFromLLM(text: string): object | null {
  // Try markdown code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* continue */ }
  }

  // Try extracting first balanced curly-brace block
  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");
  if (startIdx !== -1 && endIdx > startIdx) {
    const jsonStr = text.slice(startIdx, endIdx + 1);
    try {
      return JSON.parse(jsonStr);
    } catch { /* continue */ }
  }

  return null;
}
