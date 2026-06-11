const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

export interface ParsedVariable {
  name: string;
  label: string;
}

export function parseVariablesFromText(text: string): ParsedVariable[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  const regex = new RegExp(VARIABLE_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1]);
  }

  return Array.from(matches).map((name) => ({
    name,
    label: formatVariableLabel(name),
  }));
}

export function parseVariablesFromHtml(html: string): ParsedVariable[] {
  const textContent = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ");

  return parseVariablesFromText(textContent + " " + html);
}

export function parseVariables(
  body: string,
  htmlContent?: string | null
): ParsedVariable[] {
  const allVars = new Map<string, ParsedVariable>();

  for (const v of parseVariablesFromText(body)) {
    allVars.set(v.name, v);
  }

  if (htmlContent) {
    for (const v of parseVariablesFromHtml(htmlContent)) {
      allVars.set(v.name, v);
    }
  }

  return Array.from(allVars.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function formatVariableLabel(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function replaceVariables(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(VARIABLE_REGEX, (_, name: string) => {
    return values[name] ?? `{{${name}}}`;
  });
}

export function validateRequiredVariables(
  variables: ParsedVariable[],
  values: Record<string, string>
): string[] {
  return variables
    .filter((v) => !values[v.name]?.trim())
    .map((v) => v.label);
}
