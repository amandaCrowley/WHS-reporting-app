const GEMINI_MODEL = "gemini-3.5-flash-lite";

export async function moderateText(text) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const cleanText = typeof text === "string" ? text.trim() : "";

  if (!cleanText) {
    throw new Error("Text is required for moderation");
  }

  const prompt = `
You are a communication moderator for a university workplace health and safety reporting system.

Review the user's text for rude, abusive, insulting, threatening, harassing, discriminatory, or unnecessarily hostile language.

Important:
- Do not flag normal criticism, frustration, disagreement, or descriptions of genuine safety incidents simply because they are negative.
- Preserve the user's meaning and factual details.
- If the text is appropriate, return flagged as false and suggestion as null.
- If the text is inappropriate, return flagged as true and provide a professional, respectful rewrite.
- Do not add facts that the user did not provide.

Return ONLY valid JSON in exactly this structure:
{
  "flagged": true or false,
  "suggestion": "rewritten text" or null
}

User text:
${JSON.stringify(cleanText)}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini moderation request failed (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();

  const responseText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error("Gemini returned an empty moderation response");
  }

  const result = JSON.parse(responseText);

  if (typeof result.flagged !== "boolean") {
    throw new Error("Gemini returned an invalid moderation response");
  }

  return {
    flagged: result.flagged,
    suggestion:
      result.flagged && typeof result.suggestion === "string"
        ? result.suggestion.trim()
        : null,
  };
}
