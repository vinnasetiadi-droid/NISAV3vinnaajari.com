export type ModeId =
  | "auto"
  | "brainstorm"
  | "comprehensive"
  | "deep"
  | "plan"
  | "ringkas"
  | "socratic";

export type Role = "user" | "assistant";

export interface WorkingStep {
  label: string;
  sub?: string;
  done: boolean;
}

export interface ElicitationQuestion {
  id: string;
  q: string;
  options: string[];
}

export interface Elicitation {
  skillId: string;
  topic: string;
  questions: ElicitationQuestion[];
  answered?: boolean;
}

export type MsgKind = "text" | "elicitation" | "working" | "answers";

export interface Attachment {
  name: string;
  size: number;
  mime: string;
}

export interface Message {
  id: string;
  role: Role;
  kind: MsgKind;
  content: string;
  createdAt: number;
  status?: "pending" | "streaming" | "done" | "stopped" | "error";
  steps?: WorkingStep[];
  statusLine?: string;
  elicitation?: Elicitation;
  artifactId?: string;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  projectId?: string | null;
  mode: ModeId;
  messages: Message[];
  tokens: number;
  titleLocked?: boolean;
}

export interface ArtifactVersion {
  html: string;
  createdAt: number;
}

export interface Artifact {
  id: string;
  title: string;
  kind: "document" | "game";
  convId?: string | null;
  versions: ArtifactVersion[];
  createdAt: number;
  updatedAt: number;
}

export interface DriveFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  category: "document" | "attachment";
  folderId?: string | null;
  dataUrl?: string;
  text?: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pass: string;
  createdAt: number;
}

export interface UserData {
  conversations: Conversation[];
  artifacts: Artifact[];
  files: DriveFile[];
  folders: Folder[];
  projects: Project[];
  recent: string[];
}

export interface QuizQuestion {
  type: "mc" | "tf" | "fill" | "essay";
  prompt: string;
  options?: string[];
  answer?: string;
  points: number;
  explanation?: string;
}

export interface QuizData {
  title: string;
  subject: string;
  grade: string;
  minutes: number;
  instructions?: string;
  questions: QuizQuestion[];
}

export interface AnagramWord {
  word: string;
  hint: string;
  category: string;
  level: "EASY" | "MEDIUM" | "HARD";
}

export interface AnagramData {
  title: string;
  topic: string;
  words: AnagramWord[];
}
