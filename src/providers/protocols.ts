/**
 * The canonical model request and response, the wire shapes of the three translated protocols, typed
 * errors and stop reasons, and the protocol translator.
 *
 * @packageDocumentation
 * docs/10-providers.md section 5 is the home. Translation covers four directions: request, response,
 * error and stop reason, for anthropic-messages, openai-chat and openai-responses. The `google` protocol
 * is served only by hosts (gemini-cli natively, kimi-code); the direct lane does not translate it.
 * Translators never see a provider value: they build a wire body without the `model` field, and the
 * direct lane's request builder (`src/direct/client.ts`) fills the model, base URL and key in memory at
 * call time. Response schemas are authored in the OpenAI strict subset. When native structured output is
 * unavailable the fallback is a JSON-only instruction plus schema validation with exactly one retry; a
 * length cut-off on a structured answer is a failed call. Wire details not yet probed against a real
 * endpoint are verify by probe; tests use loopback fakes only. Implemented in M6.
 */
import type { JsonObject, JsonValue } from "../core/normalize.js";
import type { Protocol } from "../core/ids.js";

/** The protocols keel translates (the direct lane); `google` is host-only. */
export type TranslatedProtocol = Exclude<Protocol, "google">;

// ---- Canonical ----

/** One conversation message. */
export interface ModelMessage {
  role: "user" | "assistant";
  content: string;
}

/** A response schema in the OpenAI strict subset (every property required, additionalProperties false). */
export interface ResponseSchema {
  name: string;
  schema: JsonObject;
  strict: true;
}

/** The canonical request. */
export interface ModelRequest {
  system: string;
  messages: ModelMessage[];
  max_output_tokens: number;
  response_schema?: ResponseSchema;
}

/** The canonical stop reason. */
export type StopReason = "end" | "max_tokens" | "refusal" | "content_filter" | "other";

/** Token usage. */
export interface ModelUsage {
  input_tokens: number;
  output_tokens: number;
}

/** The canonical response. */
export interface ModelResponse {
  text: string;
  json?: JsonValue;
  stop_reason: StopReason;
  usage: ModelUsage;
}

/**
 * A typed error. The free-text error body is never persisted or printed; an authentication failure blocks
 * the run with `blocked(runtime_unavailable)` and points at `keel doctor --section providers`.
 */
export type ModelErrorKind =
  | "authentication"
  | "rate_limit"
  | "bad_request"
  | "server"
  | "network"
  | "timeout";

/** The canonical error. */
export interface ModelError {
  kind: ModelErrorKind;
  status: number | null;
  retryable: boolean;
}

// ---- anthropic-messages ----

/** A text content block. */
export interface AnthropicTextBlock {
  type: "text";
  text: string;
}

/** Structured output format; a capability flag that stays off for compatible endpoints until probed. */
export interface AnthropicOutputConfig {
  format: { type: "json_schema"; schema: JsonObject };
}

/** `POST <base>/v1/messages`; auth by `x-api-key` or bearer, plus `anthropic-version`. */
export interface AnthropicMessagesRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: { role: "user" | "assistant"; content: string | AnthropicTextBlock[] }[];
  output_config?: AnthropicOutputConfig;
}

/** The answer text is the concatenated text blocks. */
export interface AnthropicMessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: ({ type: "text"; text: string } | { type: string })[];
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | "refusal" | string | null;
  usage: { input_tokens: number; output_tokens: number };
}

/** The error envelope; only `error.type` is used. */
export interface AnthropicErrorBody {
  type: "error";
  error: { type: string; message: string };
}

// ---- openai-chat ----

/** `POST <base>/v1/chat/completions`; bearer auth; the system prompt is the first message. */
export interface OpenAIChatRequest {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  /** Or the endpoint's documented equivalent. */
  max_tokens?: number;
  response_format?: { type: "json_schema"; json_schema: ResponseSchema };
}

/** The answer is `choices[0].message.content`; the stop field is `choices[0].finish_reason`. */
export interface OpenAIChatResponse {
  id: string;
  choices: {
    index: number;
    message: { role: "assistant"; content: string | null; refusal?: string | null };
    finish_reason: "stop" | "length" | "content_filter" | "tool_calls" | string | null;
  }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

/** The error envelope; only `error.type` and `error.code` are used. */
export interface OpenAIErrorBody {
  error: { message: string; type: string | null; code: string | null };
}

// ---- openai-responses ----

/** `POST <base>/v1/responses`; bearer auth; the system prompt is `instructions`. */
export interface OpenAIResponsesRequest {
  model: string;
  instructions?: string;
  input: { role: "user" | "assistant"; content: string }[];
  max_output_tokens?: number;
  text?: { format: { type: "json_schema"; name: string; schema: JsonObject; strict: true } };
}

/** The answer is the `output_text` parts of `output[]` message items; stop is `status` plus details. */
export interface OpenAIResponsesResponse {
  id: string;
  status: "completed" | "incomplete" | "failed" | string;
  incomplete_details: { reason: string } | null;
  output: (
    | {
        type: "message";
        role: "assistant";
        content: ({ type: "output_text"; text: string } | { type: "refusal"; refusal: string })[];
      }
    | { type: string }
  )[];
  usage?: { input_tokens: number; output_tokens: number };
}

// ---- Translator ----

/** The wire shapes of each translated protocol. */
export interface ProtocolWire {
  "anthropic-messages": {
    path: "/v1/messages";
    request: AnthropicMessagesRequest;
    response: AnthropicMessagesResponse;
    error: AnthropicErrorBody;
  };
  "openai-chat": {
    path: "/v1/chat/completions";
    request: OpenAIChatRequest;
    response: OpenAIChatResponse;
    error: OpenAIErrorBody;
  };
  "openai-responses": {
    path: "/v1/responses";
    request: OpenAIResponsesRequest;
    response: OpenAIResponsesResponse;
    error: OpenAIErrorBody;
  };
}

/** A wire request without the model; the direct lane fills it in memory at call time. */
export type WireRequestWithoutModel<P extends TranslatedProtocol> = Omit<ProtocolWire[P]["request"], "model">;

/** Whether the translator may use the protocol's native structured output. */
export interface TranslatorCapabilities {
  native_structured_output: boolean;
}

/** One translator per protocol, all four directions. */
export interface ProtocolTranslator<P extends TranslatedProtocol> {
  readonly protocol: P;
  readonly path: ProtocolWire[P]["path"];
  request(request: ModelRequest, capabilities: TranslatorCapabilities): WireRequestWithoutModel<P>;
  response(body: ProtocolWire[P]["response"]): ModelResponse;
  error(status: number | null, body: ProtocolWire[P]["error"] | null): ModelError;
  stop(body: ProtocolWire[P]["response"]): StopReason;
}
