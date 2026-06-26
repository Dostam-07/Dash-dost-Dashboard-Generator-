/**
 * A highly resilient partial JSON repair function that can take a streaming,
 * incomplete JSON buffer and repair it into valid JSON.
 */
export function repairJSON(str: string): string {
  let cleaned = str.trim();
  if (!cleaned) return "{}";

  let inString = false;
  let escape = false;
  const stack: string[] = [];
  let result = "";

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    result += char;

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        stack.push('}');
      } else if (char === '[') {
        stack.push(']');
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '}') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ']') {
          stack.pop();
        }
      }
    }
  }

  // If the parsing ended while inside a string context, seal it
  if (inString) {
    result += '"';
  }

  // Work backwards from the result to trim trailing invalid punctuation or incomplete key names
  let trimmed = result.trim();
  let doneTrimming = false;

  while (!doneTrimming) {
    if (
      trimmed.endsWith(",") ||
      trimmed.endsWith(":") ||
      trimmed.endsWith("[") ||
      trimmed.endsWith("{")
    ) {
      const lastChar = trimmed[trimmed.length - 1];
      trimmed = trimmed.slice(0, -1).trim();
      
      // If we trimmed an open grouping, pop its matching element from our closing stack
      if (lastChar === '{') {
        const lastIndex = stack.lastIndexOf('}');
        if (lastIndex !== -1) stack.splice(lastIndex, 1);
      } else if (lastChar === '[') {
        const lastIndex = stack.lastIndexOf(']');
        if (lastIndex !== -1) stack.splice(lastIndex, 1);
      }
    } else {
      // Check for dangling partial identifiers or unclosed keys, e.g. "title" or "id": "something"
      // If we have "some_key": without value, let's trim it
      const matchKeyColon = trimmed.match(/"[^"]*"\s*:\s*$/);
      if (matchKeyColon) {
        trimmed = trimmed.slice(0, trimmed.length - matchKeyColon[0].length).trim();
      } else {
        doneTrimming = true;
      }
    }
  }

  // Reverse complete our stack path
  for (let j = stack.length - 1; j >= 0; j--) {
    trimmed += stack[j];
  }

  // Ensure overall boundaries exist
  if (!trimmed.startsWith("{")) {
    trimmed = "{" + trimmed;
  }
  if (!trimmed.endsWith("}")) {
    trimmed = trimmed + "}";
  }

  return trimmed;
}

/**
 * Parses an incomplete JSON string into a valid object state.
 * It will attempt to repair it and fall back to a safe partial schema if parsing fails.
 */
export function parsePartialPayload(raw: string): any {
  if (!raw.trim()) return null;
  
  let parsedRaw = raw.trim();
  
  // Slicing from the first open brace to skip any conversational prelude or markdown tags
  const firstBrace = parsedRaw.indexOf('{');
  if (firstBrace !== -1) {
    parsedRaw = parsedRaw.substring(firstBrace);
  }
  
  parsedRaw = parsedRaw.trim();
  
  // Robustly remove trailing markdown wrappers even if they have extra spaces/newlines
  while (parsedRaw.endsWith("`") || parsedRaw.endsWith("\n") || parsedRaw.endsWith("\r") || parsedRaw.endsWith(" ")) {
    if (parsedRaw.endsWith("```")) {
      parsedRaw = parsedRaw.substring(0, parsedRaw.length - 3).trim();
      break;
    } else if (parsedRaw.endsWith("`")) {
      parsedRaw = parsedRaw.substring(0, parsedRaw.length - 1);
    } else {
      parsedRaw = parsedRaw.substring(0, parsedRaw.length - 1).trim();
    }
  }
  
  parsedRaw = parsedRaw.trim();

  // Repair the string
  const repaired = repairJSON(parsedRaw);

  try {
    const obj = JSON.parse(repaired);
    
    // Perform standard adjustments to guarantee structure safety
    if (obj && typeof obj === 'object') {
      if (!obj.title) obj.title = "Generating Dashboard...";
      if (!obj.filters) obj.filters = [];
      if (!obj.components) obj.components = [];
      
      // Filter out empty/unformed components in the array
      obj.components = obj.components.filter((c: any) => {
        return c && typeof c === 'object' && c.id && c.type;
      }).map((c: any) => {
        // Ensure layouts exist
        if (!c.layout) c.layout = { sm: 12, md: 12, lg: 6 };
        if (typeof c.layout.sm !== 'number') c.layout.sm = 12;
        if (typeof c.layout.md !== 'number') c.layout.md = 12;
        if (typeof c.layout.lg !== 'number') c.layout.lg = 6;
        
        // Ensure config exists
        if (!c.config) c.config = {};
        if (!c.seriesData) c.seriesData = [];
        return c;
      });
    }
    return obj;
  } catch (e) {
    console.warn("Failed parsing partially repaired JSON:", e, repaired);
    return null;
  }
}
