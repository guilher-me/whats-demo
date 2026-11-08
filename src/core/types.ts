export type Value =
  string | number | boolean | null | Value[] | { [key: string]: Value | undefined } | undefined;
export type Values = Record<string, Value>;
export interface Option {
  id: string;
  title: string;
}
export interface FlowAction {
  name: string;
  next?: { type: string; name: string };
  payload?: Values;
}
export interface FlowComponent {
  type: string;
  name?: string;
  label?: string;
  text?: string;
  required?: boolean;
  visible?: boolean | string;
  condition?: string | boolean;
  then?: FlowComponent[];
  else?: FlowComponent[];
  children?: FlowComponent[];
  'data-source'?: Option[] | string;
  'input-type'?: string;
  'helper-text'?: string;
  'min-chars'?: number;
  'max-chars'?: number;
  'max-length'?: number;
  'min-selected-items'?: number;
  'max-selected-items'?: number;
  'min-date'?: string;
  'max-date'?: string;
  'unavailable-dates'?: string[] | string;
  pattern?: string;
  'on-click-action'?: FlowAction;
}
export interface FlowScreen {
  id: string;
  title: string;
  terminal?: boolean;
  data?: Record<string, { type?: string; _example_?: Value; __example__?: Value }>;
  layout: { type: string; children: FlowComponent[] };
}
export interface FlowDefinition {
  version: string;
  routing_model?: Record<string, string[]>;
  screens: FlowScreen[];
}
export interface Contact {
  name: string;
  verified: boolean;
}
export type ImageExtension = 'png' | 'jpg';
export type DocumentExtension = 'pdf' | 'txt' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx';
export type DocumentUnit = 'KB' | 'MB';

export type Attachment = { id: string; name: string } & (
  | { kind: 'image'; extension: ImageExtension }
  | { kind: 'document'; extension: DocumentExtension; sizeLabel: string }
);
export type AttachmentKind = Attachment['kind'];

export type MediaStep =
  | { kind: 'image'; file: { extension: ImageExtension; name: string }; caption?: string }
  | {
      kind: 'document';
      file: { extension: DocumentExtension; name: string; size?: number; unit: DocumentUnit };
      caption?: never;
    };
export interface MessageStep {
  id: string;
  type: 'user' | 'business';
  text: string;
  delay: number;
  voiceDurationSeconds?: number;
  media?: MediaStep;
  typing?: boolean;
  typingMs?: number;
  interactive?: BusinessInteractive;
}
export interface MessageOption extends Option {
  description?: string;
}
export type MessageButtonType = 'quick_reply' | 'url' | 'phone_number' | 'copy_code' | 'voice_call';
export interface MessageButton extends MessageOption {
  /** Omitted in existing v1 links: quick reply. */
  type?: MessageButtonType;
  url?: string;
  phoneNumber?: string;
  code?: string;
  ttlMinutes?: number;
}
export interface ListSection {
  title: string;
  rows: MessageOption[];
}
interface InteractiveBase {
  header?: string;
  footer?: string;
  autoReplyId?: string;
}
export interface ReplyButtonsMessage extends InteractiveBase {
  kind: 'buttons';
  context?: 'interactive' | 'template';
  buttons: MessageButton[];
}
export interface ListMessage extends InteractiveBase {
  kind: 'list';
  button: string;
  sections: ListSection[];
}
export type BusinessInteractive = ReplyButtonsMessage | ListMessage;
export interface FlowStep {
  id: string;
  type: 'flow';
  text: string;
  delay: number;
  typing?: boolean;
  typingMs?: number;
  label: string;
  completion?: string;
  flow: FlowDefinition;
  answers: Values;
}
export type Step = MessageStep | FlowStep;
export interface Project {
  version: 1;
  contact: Contact;
  steps: Step[];
}
export interface ExpressionContext {
  data: Values;
  form: Values;
}
export interface ChatMessage {
  id: string;
  direction: 'user' | 'business';
  text: string;
  time: string;
  voiceDurationMs?: number;
  attachment?: Attachment;
  flowStep?: FlowStep;
  completed?: boolean;
  interactive?: BusinessInteractive;
  selection?: string;
  receipt?: 'delivered' | 'read';
}
export interface FlowHistory {
  index: number;
  data: Values;
  form: Values;
}
export interface FlowSession extends FlowHistory {
  step: FlowStep;
  history: FlowHistory[];
  visible: boolean;
  closing: boolean;
}
