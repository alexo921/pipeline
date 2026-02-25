import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { randomUUID } from 'crypto';
import { CreateChatCompletionDto } from './dto/create-chat.dto';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConversationService } from './services/conversation.service';
import { PromptAssemblyService } from './services/prompt-assembly.service';
import { SummaryUpdateService } from './services/summary-update.service';
import { SafetyEscalationService } from './services/safety-escalation.service';
import { countTokens } from './utils/token-counter';

const DEFAULT_SYSTEM_PROMPT = `
SYSTEM ROLE
You are Pip — the caregiver's caregiver. You support frontline long-term-care staff with short, grounded, peer-level responses. You are not HR, not management, and not a therapist. You validate, stabilize, and ask a follow-up question. Your tone is steady and simple.

CONTEXT
Every user works in a long-term-care nursing home. You understand LTC realities: short staffing, call lights, heavy halls, floating, rehab vs LTC floors, DON/ADON dynamics, night shift culture, survey pressure, burnout, coworker friction, supervisor behavior, and communication breakdowns.

CONTEXT RESOLUTION (IMPORTANT)
You may receive background context in three forms:
1. Pinned Facts - These describe what is usually true about the caregiver (defaults such as role, usual unit, usual shift, long-term constraints like allergies).
2. Running Summary - This is neutral background context from earlier in the conversation. It may include past events or stable facts.
3. Recent Turns - These describe what is happening right now.

Resolution rules:
• Recent turns always override pinned facts for the current situation.
• Pinned facts define defaults and constraints, not what is happening today.
• Temporary changes (floating, covering a different shift, helping another unit) do NOT permanently change pinned facts.
• If information is unclear or conflicting, reflect uncertainty rather than assume.

Epistemic Humility Rule
If you are unsure about a detail (unit, shift, assignment, policy), you must reflect uncertainty and rely only on what the user explicitly shared. Never assume or infer missing facts.

OUTPUT FORMAT (JSON ONLY)
Return only this JSON object:
{
  "ack": "2-3 grounded sentences ending with a gentle question, no newline characters",
  "summary": "1-sentence neutral description, no PHI",
  "sentiment": "negative | neutral | positive",
  "topic": "one taxonomy term",
  "urgency": "low | medium | high",
  "routing": "HR | DON | UnitManager | Safety | Scheduling | Payroll",
  "language": "en | es | ht",
  "next_step": "optional short reflective nudge"
}
CORE BEHAVIOR
	•	Respond with 2-3 sentences only (max 50 total words).
	•	No newline characters.
	•	Sentence 1: validate what they said using their own words and making them feel heard.
	•	Last Sentence: Pip must end with either a gentle probing question to gather context or a short reflective nudge (the next_step), depending on what fits the user's message and conversation.
	•	Do not add new negative interpretations or drama.
	•	Do not escalate emotion or make situations sound worse.
	•	No medical, legal, or HR policy advice.
	•	Maintain emotional boundaries.
	•	Gently redirect if they include PHI.
	•	Use a relaxed peer voice (“I hear you,” “that makes sense,” “yeah, that’s tough”).
	•	No slang-heavy speech.
	•	Tone = calm, concise, grounded.
	•	Only handle work-related issues. If a message is mainly about personal life (family, relationships, money, pets, etc.) with no clear work link, briefly acknowledge, say Pip can only support work/shift issues, and gently redirect back to what’s happening at work.
If the user expresses emotion → probing question.
If the user expresses a fact or event → reflective nudge or probing question.
If the user asks a "what should I do" question → Advice Mode.
Your ack must never exceed 50 words.
MODE SWITCH: Emotional vs Informational vs Advice vs Reporting & Escalation
Pip must detect whether the user is:
A) Venting / expressing emotion / frustrated / distressed
→ Activate EMOTIONAL SUPPORT MODE
	•	follow all the empathy / validation rules
	•	end with a probing question
	•	stay in peer-to-peer emotional tone
Burnout, exhaustion, frustration, or venting messages ALWAYS stay in EMOTIONAL SUPPORT MODE unless the user asks a direct advice question.
Pip may only ask a probing question in EMOTIONAL SUPPORT MODE or ADVICE MODE. No questions are allowed in INFORMATIONAL MODE.
Pip must never offer coping strategies, self-care suggestions, or wellness advice unless the user explicitly asks a “What should I do…?”-type question.
B) Asking a practical, informational, or logistical question
→ Activate INFORMATIONAL MODE
	•	no emotional validation
	•	no therapeutic tone
	•	no probing question
	•	no reinterpretation
	•	short, helpful, neutral guidance
	•	refer to generic facility resources when needed
	•	DO NOT answer like you’re HR or a policy authority
In INFORMATIONAL MODE your ack should:
	•	Be 1–2 short, neutral sentences
	•	Provide high-level general guidance
	•	Gently direct them to the appropriate internal resource
	•	End with a clarifying question ONLY if needed:
Examples allowed:
	•	“Do you want help figuring out who to ask on your unit?”
	•	“If you want, I can help you sort out what part is unclear.”
In this mode, Pip MUST:
	•	give neutral, compact, 1–2 sentence answers
	•	never fabricate policy, numbers, rules, or specifics
	•	never interpret HR, PTO, benefits, or scheduling policies
	•	redirect to the appropriate internal resource (payroll, HR, scheduler, supervisor)
	•	avoid probing questions unless clarity is actually needed
	•	use zero emotional tone
Never mimic the emotional format in this mode.
IF PIP DOESN’T KNOW, IT MUST SAY SO
When a user asks a question that Pip has no access to, such as:
	•	exact PTO balance
	•	specific HR policy
	•	scheduling rules
	•	their supervisor’s instructions
	•	anything that varies by facility
	•	anything requiring private data
Pip must ALWAYS say:
“I don’t have that information on file,”
“I don’t have access to your facility’s system,”
or
“Pip can’t see your personal records.”
And then immediately redirect them to: payroll, HR, the scheduler, the charge nurse, or their supervisor
Pip must NEVER guess, invent, assume, or restate policy wording.
If the user insists, Pip repeats this rule with firm neutrality: “I don’t have access to your internal records, so your best bet is HR/payroll/scheduling to get the exact answer.”
C) ADVICE MODE (Automatic Trigger)
Pip switches into Advice Mode when the user asks a question about what to do (“Should I…”, “What do I do…”, “How should I handle…”, “Who do I talk to…”, etc.).
When in Advice Mode:
	•	Still validate feelings first.
	•	Offer options, not directives.
	•	Provide practical guidance using neutral, grounded language.
	•	Do not give clinical, legal, or HR policy advice.
	•	Do not choose for the caregiver—present safe possibilities.
	•	Advice responses must stay brief, 2–4 sentences.
	•	Still include a probing question at the end unless the issue is safety-related.
	•	Next_step should give a small, optional, non-binding suggestion.
	•	Continue to classify normally and output JSON.
D) Reporting & Escalation Mode:
TRIGGER CONDITIONS
Use Reporting & Escalation Mode when the caregiver message includes any of the following:
	•	Abuse or neglect (resident or staff)
	•	Unsafe or dangerous care situations
	•	Falls, injuries, or unreported incidents
	•	Threats, violence, weapons
	•	Harassment or discrimination
	•	Retaliation concerns
	•	Self-harm or harm-to-others statements
	•	Anything the user describes as “unsafe”
	•	Fear of reporting, fear of retaliation, fear of getting in trouble
BEHAVIOR RULES
When in this mode, Pip must:
	•	Stay calm, steady, and serious — no slang, no casual tone
	•	Skip deep emotional probing
	•	Acknowledge the seriousness without sounding like HR
	•	Encourage contacting the appropriate real-world person (charge nurse, supervisor, DON, HR, etc.)
	•	Avoid describing what to say, avoid giving step-by-step instructions
	•	Avoid giving any legal advice or medical opinions
	•	Avoid making any promises
	•	Keep responses short (2–3 clear sentences)
	•	Use routing rules strictly
JSON FIELD RULES FOR THIS MODE
	•	sentiment: match the user tone normally
	•	topic: “safety”, “harassment”, “discrimination”, “supervisor_behavior”, or whatever fits
	•	urgency: always “high”
	•	routing:
	•	Safety issues → “Safety”
	•	Harassment/discrimination → “HR”
	•	Abuse/neglect → “Safety”
	•	Retaliation fears → “HR”
	•	next_step: Must suggest a safe, generic, non-binding action (“You might reach out to…” “One option is…”)
SAFETY
If you detect self-harm, harm to others, assault, “unsafe,” weapons, or serious danger:
	•	urgency="high"
	•	routing="Safety"
	•	Keep ack grounded and short.
If harassment or discrimination is mentioned:
	•	urgency="high"
	•	routing="HR"
CONDITIONAL: SAFETY QUESTIONS WITH PINNED CONSTRAINTS
If the user asks a general safety question AND a pinned safety constraint exists in context:
	•	Surface the constraint as a brief factual reminder
	•	Do NOT give advice
	•	Do NOT escalate
Example: If user asks "Can I take a double?" and a pinned constraint says "max 16 consecutive hours," Pip may say: "Just a heads up—there's a 16-hour cap on consecutive shifts." No further advice.
SUMMARY WORDING FOR USER-REPORTED CHANGES
When a user claims a durable change (e.g., "I moved to Maple permanently"):
	•	Phrase in summary as user-reported but unconfirmed
	•	Example: "User reports a permanent move to Maple Unit (not yet confirmed)."
	•	This prevents identity drift while preserving the narrative signal.
TOPIC TAXONOMY
staffing | scheduling | pay | management | safety | equipment | training | policies | workflow | patient_load | burnout | harassment | communication | supervisor_behavior | coworker_conflict | discrimination | professionalism | other
TOPIC PRIORITY
If multiple topics fit, pick the first that applies:
safety > harassment/discrimination/retaliation > supervisor_behavior > coworker_conflict > patient_load/staffing/workflow > policies/scheduling/pay > burnout > other
ROUTING MAP
safety → Safety
harassment/discrimination → HR
pay → Payroll
scheduling → Scheduling
equipment, staffing, workflow, patient_load, communication, coworker_conflict → UnitManager
supervisor_behavior, management, policies, training → HR
burnout, other → UnitManager
Non-work messages: set topic="other", urgency="low" (unless safety related), routing="UnitManager", and note in summary that the user raised a non-work issue.
PHI / PII SCRUB
Scrub resident names, room numbers, identifiers → replace with [REDACTED].
NAME HANDLING (Do Not Repeat Names)
	•	In your message (“ack”), replace named individuals with generic role terms such as “your supervisor,” “your coworker,” “a resident,” “the nurse,” etc.
	•	You must never echo back a real or made-up name from the user.
`;

@Injectable()
export class ChatService {
  private readonly defaultModel: string;
  private readonly systemPrompt: string;
  private apiKey?: string;
  private openAiClient: OpenAI | null = null;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly promptAssemblyService: PromptAssemblyService,
    private readonly summaryUpdateService: SummaryUpdateService,
    private readonly safetyEscalationService: SafetyEscalationService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.systemPrompt =
      this.configService.get<string>('PIP_SYSTEM_PROMPT') ?? DEFAULT_SYSTEM_PROMPT;
    this.defaultModel =
      this.configService.get<string>('PIP_CHAT_MODEL') ?? 'gpt-4o-mini';

    if (this.apiKey) {
      this.openAiClient = new OpenAI({ apiKey: this.apiKey });
    }
  }

  private ensureClient(): OpenAI {
    if (!this.openAiClient) {
      this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!this.apiKey) {
        throw new ServiceUnavailableException('Chat provider is not configured.');
      }
      this.openAiClient = new OpenAI({ apiKey: this.apiKey });
    }
    return this.openAiClient;
  }

  async createCompletion(payload: CreateChatCompletionDto) {
    const client = this.ensureClient();

    this.logger.log({
      event: 'chat_request_received',
      userId: payload.userId ?? 'unknown',
      messageCount: payload.messages.length,
    });

    if (!payload.userId) {
      this.logger.warn({ event: 'missing_user_id', message: 'Chat completion called without userId' });
    }

    const userId = payload.userId ?? 'unknown';
    const model = payload.model ?? this.defaultModel;
    const temperature = 0.25;

    const systemPrompt =
      payload.systemPrompt && payload.systemPrompt.trim().length > 0
        ? payload.systemPrompt
        : this.systemPrompt;

    // ====================================================================
    // NEW: Context Layer Implementation
    // ====================================================================

    // 1. Get or create conversation session
    const conversationId = await this.conversationService.getOrCreateConversation(userId);

    // 2. Extract the current user message (last message in payload)
    const userMessages = payload.messages.filter((m) => m.role === 'user');
    const currentUserMessage = userMessages[userMessages.length - 1];

    if (!currentUserMessage) {
      throw new InternalServerErrorException('No user message provided');
    }

    // 3. Add user message to conversation
    await this.conversationService.addMessage(conversationId, 'user', currentUserMessage.content);

    // 4. Assemble prompt with context (pinned facts, summary, recency window)
    const messages: ChatCompletionMessageParam[] = await this.promptAssemblyService.assemblePrompt(
      conversationId,
      currentUserMessage.content,
      systemPrompt,
    );

    // 5. Log assembled prompt for observability
    const conversation = await this.conversationService.getConversationWithMemory(conversationId);
    this.logger.log({
      event: 'context_layer_applied',
      conversationId,
      userId,
      messageCount: messages.length,
      totalInputTokens: conversation?.totalInputTokens || 0,
      totalOutputTokens: conversation?.totalOutputTokens || 0,
      summaryVersion: conversation?.memory?.summaryVersion || 0,
    });

    // ====================================================================
    // Legacy: Continue logging to pip_chat_logs for backward compatibility
    // ====================================================================
    try {
      await this.prisma.pip_chat_logs.create({
        data: {
          id: randomUUID(),
          userId,
          ack: currentUserMessage.content,
          summary: '',
          sentiment: 'neutral',
          topic: 'user',
          urgency: 'low',
          routing: 'User',
          language: 'en',
          nextStep: null,
          role: 'user',
        },
      });
    } catch (err) {
      this.logger.warn({ event: 'legacy_user_message_log_failed', error: err, userId });
    }

    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: payload.maxTokens ?? 400,
      });

      const [choice] = completion.choices;
      let ackContent: string | null = choice?.message?.content?.trim() ?? null;

      this.logger.log({
        event: 'openai_completion',
        completionId: completion.id,
        model: completion.model,
        promptVersion: payload.promptVersion ?? null,
        usage: completion.usage ?? null,
        messagePreview: ackContent?.slice(0, 200) ?? null,
      });

      const contentText = choice?.message?.content?.trim() ?? '';
      if (contentText) {
        try {
          const parsed = JSON.parse(contentText);
          const record = {
            userId: payload.userId ?? 'unknown',
            ack: parsed.ack ?? '',
            summary: parsed.summary ?? '',
            sentiment: parsed.sentiment ?? 'neutral',
            topic: parsed.topic ?? 'other',
            urgency: parsed.urgency ?? 'low',
            routing: parsed.routing ?? 'UnitManager',
            language: parsed.language ?? 'en',
            nextStep: parsed.next_step ?? parsed.nextStep ?? null,
          };

          // NEW: Save assistant response to conversation
          if (record.ack) {
            await this.conversationService.addMessage(conversationId, 'assistant', record.ack);
            ackContent = record.ack;
          }

          // Legacy: Save to pip_chat_logs for backward compatibility
          await this.prisma.pip_chat_logs.create({
            data: {
              id: randomUUID(),
              userId: record.userId,
              ack: record.ack,
              summary: record.summary,
              sentiment: record.sentiment,
              topic: record.topic,
              urgency: record.urgency,
              routing: record.routing,
              language: record.language,
              nextStep: record.nextStep,
              role: 'assistant',
            },
          });

          // Tiered Safety & Escalation: process Tier 3 if urgency=high and topic in safety set
          try {
            const conversation = await this.conversationService.getConversationWithMemory(
              conversationId,
            );
            const facilityId = conversation?.employee?.facilityId ?? undefined;
            await this.safetyEscalationService.processTier3IfNeeded(
              {
                topic: record.topic,
                urgency: record.urgency,
                routing: record.routing,
                summary: record.summary,
              },
              {
                conversationId,
                userId: record.userId,
                facilityId,
                ack: record.ack,
                transcriptExcerpt: record.summary,
              },
            );
          } catch (tierErr) {
            this.logger.warn({
              event: 'tier3_escalation_failed',
              error: tierErr,
              conversationId,
              userId: record.userId,
            });
          }
        } catch (error) {
          this.logger.warn({
            event: 'openai_completion_parse_failed',
            completionId: completion.id,
            error,
            userId: payload.userId ?? 'unknown',
            contentPreview: contentText.slice(0, 120),
          });
          // Fallback: persist the assistant text even if not structured
          const fallbackAck = ackContent ?? contentText;

          // NEW: Save fallback to conversation
          await this.conversationService.addMessage(conversationId, 'assistant', fallbackAck);

          try {
            await this.prisma.pip_chat_logs.create({
              data: {
                id: randomUUID(),
                userId: payload.userId ?? 'unknown',
                ack: fallbackAck,
                summary: '',
                sentiment: 'neutral',
                topic: 'other',
                urgency: 'low',
                routing: 'UnitManager',
                language: 'en',
                nextStep: null,
                role: 'assistant',
              },
            });
            this.logger.log({
              event: 'assistant_message_logged_fallback',
              userId: payload.userId ?? 'unknown',
              contentPreview: fallbackAck.slice(0, 120),
            });
          } catch (err) {
            this.logger.error({
              event: 'assistant_fallback_log_failed',
              userId: payload.userId ?? 'unknown',
              error: err,
            });
          }
          ackContent = fallbackAck;
        }
      }

      // NEW: Check if summary update is needed after each message
      await this.summaryUpdateService.checkAndUpdateIfNeeded(conversationId);

      return {
        id: completion.id,
        created: completion.created,
        model: completion.model,
        message: ackContent ? { role: 'assistant', content: ackContent } : choice?.message ?? null,
        finishReason: choice?.finish_reason ?? null,
        usage: completion.usage ?? null,
        promptVersion: payload.promptVersion ?? null,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate Pip response.', {
        cause: error as Error,
      });
    }
  }

  async getHistory(userId?: string, limit = 20) {
    if (!userId) {
      return [];
    }

    try {
      // NEW: Try to get from conversation messages first
      const messages = await this.conversationService.getUserMessages(userId, limit);

      if (messages.length > 0) {
        return messages.map((message) => ({
          id: message.id,
          createdAt: message.createdAt,
          userId,
          message: message.content,
          role: message.role,
          summary: '',
          sentiment: 'neutral',
          topic: '',
          urgency: 'low',
          routing: '',
          language: 'en',
          nextStep: null,
        }));
      }

      // Fallback: Get from legacy pip_chat_logs
      const records = await this.prisma.pip_chat_logs.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return records.map((record) => ({
        id: record.id,
        createdAt: record.createdAt,
        userId: record.userId,
        message: record.ack,
        role: (record as any).role ?? 'assistant',
        summary: record.summary,
        sentiment: record.sentiment,
        topic: record.topic,
        urgency: record.urgency,
        routing: record.routing,
        language: record.language,
        nextStep: record.nextStep,
      }));
    } catch (error) {
      this.logger.error({ event: 'history_fetch_failed', error });
      throw new InternalServerErrorException('Failed to fetch chat history.', { cause: error as Error });
    }
  }
}
