import { parseVoiceSentence, VoiceCommand } from "./voiceParser";

let buffer: string[] = [];

export function startVoiceSession() {
  buffer = [];
}

export function collectTranscript(text: string) {
  if (!text || !text.trim()) return;
  buffer.push(text.trim());
}

export function finishVoiceSession(): VoiceCommand[] {
  const commands = buffer
    .map(parseVoiceSentence)
    .filter(c => c.type !== "ignore");

  buffer = [];
  return commands;
}
