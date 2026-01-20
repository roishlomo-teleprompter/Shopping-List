export type VoiceCommand =
  | { type: "add"; name: string; quantity: number }
  | { type: "delete"; name: string }
  | { type: "clear" }
  | { type: "ignore" };

const NUMBER_WORDS: Record<string, number> = {
  "אחד": 1,
  "אחת": 1,
  "שניים": 2,
  "שני": 2,
  "שתיים": 2,
  "שתי": 2,
  "שלוש": 3,
  "שלושה": 3,
  "ארבע": 4,
  "ארבעה": 4,
  "חמש": 5,
  "חמישה": 5,
  "שש": 6,
  "שישה": 6,
  "שבע": 7,
  "שבעה": 7,
  "שמונה": 8,
  "תשע": 9,
  "תשעה": 9,
  "עשר": 10,
  "עשרה": 10,
};

function wordToNumber(word: string): number | null {
  if (/^\d+$/.test(word)) return Number(word);
  return NUMBER_WORDS[word] ?? null;
}

export function parseVoiceSentence(text: string): VoiceCommand {
  const clean = text
    .trim()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ");

  // מחק רשימה
  if (clean.includes("מחק רשימה") || clean.includes("נקה רשימה")) {
    return { type: "clear" };
  }

  const parts = clean.split(" ");

  // חמש עגבניות / 5 עגבניות / רסק עגבניות
  if (parts.length >= 2) {
    const maybeNumber = wordToNumber(parts[0]);
    if (maybeNumber !== null) {
      const name = parts.slice(1).join(" ");
      return { type: "add", name, quantity: maybeNumber };
    }
  }

  // ללא כמות – פריט רגיל (כולל מילים מחוברות)
  return {
    type: "add",
    name: clean,
    quantity: 1,
  };
}
