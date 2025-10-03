from typing import Any, Text, Dict, List
import requests
import json
import os
import sys
import re
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, ActionExecuted

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

try:
    from rag_service import rag_service
    RAG_AVAILABLE = True
except ImportError as e:
    print(f"RAG service not available: {e}")
    RAG_AVAILABLE = False

# Regex Clamp List (server-side, applied after LLM; override only on confident matches)
CLAMPS = [
    # Safety first
    (r"\b(threat|threatened|unsafe|assault|weapon|violence|no ppe|broken lift)\b",
     {"topic": "safety", "routing": "Safety", "urgency": "high"}),
    # Patient load vs staffing
    (r"\b(\d{1,2}\s?(patients|pts?)|alone on|double (shift|load))\b",
     {"topic": "patient_load"}),
    (r"\b(short staffed|understaffed|call[- ]?outs?|float coverage|not enough staff)\b",
     {"topic": "staffing"}),
    # Communication vs coworker vs supervisor
    (r"\b(handoff|ignored (notes|handoff)|no updates|unclear instructions)\b",
     {"topic": "communication"}),
    (r"\b(roll(ing)? eyes|gossip|refus(ing|ed) help|passive[- ]?aggressive)\b",
     {"topic": "coworker_conflict"}),
    (r"\b(charge nurse|supervisor|manager|lead|retaliat|belittle|favoritism)\b",
     {"topic": "supervisor_behavior", "routing": "HR"}),
    # Pay & scheduling
    (r"\b(overtime|OT|paycheck|rate|bonus)\b", {"topic": "pay", "routing": "Payroll"}),
    (r"\b(schedule|posted late|swap|time off|pto request)\b", {"topic": "scheduling", "routing": "Scheduling"}),
    # Equipment & supplies
    (r"\b(broken (lift|pump)|no gloves|equipment (down|broken)|malfunction(ing)?|lift.*broken|pump.*failing)\b",
     {"topic": "equipment"}),
    # Harassment / discrimination keywords
    (r"\b(harass(ed|ment)|slur|racis\w*|sexis\w*|homophob\w*|used slurs)\b",
     {"topic": "harassment", "routing": "HR", "urgency": "high"}),
    (r"\b(discriminat\w+|ageism|biased|bias|comment about my age|unfairly because of my accent)\b",
     {"topic": "discrimination", "routing": "HR", "urgency": "high"}),
    # Sentiment clamps
    (r".*", {"sentiment": "negative"}, ["safety","harassment","discrimination"])  # if topic is any of these
]

def apply_regex_clamps(text: str, llm_response: Dict) -> Dict:
    """Apply regex clamps to override LLM decisions with confident pattern matches."""
    text_lower = text.lower()
    result = llm_response.copy()
    
    # Apply clamps in order: Safety → PatientLoad/Staffing → Comm/Peer/Supervisor → Pay/Scheduling → Equipment → Harassment/Discrimination → Sentiment clamp
    for pattern, overrides, *conditions in CLAMPS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            # Check conditions for sentiment clamp
            if len(conditions) > 0 and conditions[0]:
                required_topics = conditions[0]
                if result.get("topic") in required_topics:
                    result.update(overrides)
            else:
                # Apply override for regular clamps
                result.update(overrides)
    
    return result


class ActionRAGEnhancedChat(Action):
    """RAG-enhanced action that retrieves relevant knowledge before generating responses."""

    def name(self) -> Text:
        return "action_rag_enhanced_chat"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        user_message = tracker.latest_message.get('text', '')
        
        # Get relevant context using RAG
        if RAG_AVAILABLE:
            context = rag_service.get_context_for_query(user_message)
        else:
            context = "I'm here to help with healthcare workforce management questions."
        
        # Get conversation history
        conversation_history = []
        for event in tracker.events:
            if event.get('event') == 'user':
                conversation_history.append({"role": "user", "content": event.get('text', '')})
            elif event.get('event') == 'bot':
                conversation_history.append({"role": "assistant", "content": event.get('text', '')})

        # Create enhanced system prompt with RAG context
        system_prompt = f"""SYSTEM ROLE
You are Pip — the caregiver's caregiver. A mental health buddy for frontline staff.
You are not management or HR. You're "one of them."

CORE BEHAVIOR
• Listen first. Acknowledge feelings in 1–2 short, plain sentences. Light emoji are okay, not required.
• Sound like a peer texting after a shift: casual, real, never corporate.
• Mirror their mood. If stressed, respond tired-but-supportive. If proud, celebrate a bit.
• Use "we/us" at times to reinforce community: we're building the heartbeat, others flagged this too.
• Never give medical, legal, or HR policy advice. Never promise outcomes.
• Default to anonymity. If they share PHI/patient details, gently redirect and do not include PHI in JSON.
• Safety or self-harm hints → set urgency=high and route to Safety/HR per rules below.
• After the short peer reply ("ack"), always output the structured JSON object described in OUTPUT FORMAT.
• Keep "ack" ≤160 chars, "summary" ≤160 chars, "next_step" ≤120 chars.

TOPIC DECISION GUIDE (use exactly one topic; apply these tie-breakers):
• patient_load: message focuses on count/ratio of patients or being alone (e.g., "12 patients," "alone on 3 West," "double load"), even if staffing is mentioned.
• staffing: not enough people or coverage (e.g., "short staffed," "call-outs," "need float"), when no explicit patient counts drive the complaint.
• communication: missed handoff notes, no updates, unclear instructions; the problem is HOW info flows.
• coworker_conflict: the problem is a peer/teammate (rude, refusing help, gossip, eye-rolling).
• supervisor_behavior: the problem is a charge nurse/lead/supervisor/manager (belittling, retaliation, favoritism).
• safety: threats, assault, weapons, violence, unsafe equipment/conditions, no PPE.
• pay: overtime, rate, paycheck, bonus.
• scheduling: shift times, swaps, posted late, time off.
• equipment: broken, failing, missing stock (lifts, pumps, gloves).
• burnout: exhaustion, "tired all the time," emotional depletion.
• policies: PTO, breaks, attendance rules; questions or enforcement issues.
• workflow: process friction (duplicate forms, chaotic intake), not people/communication tone.
• training: missing coaching, need to learn a skill (transfers, wound care).
• management: broad leadership problems or policy shifts (if not specific to a supervisor).
• harassment: slurs, targeted abuse; if protected trait is implied → consider discrimination.
• discrimination: unfair treatment tied to protected traits (race, age, accent, etc.).
• professionalism: positive/constructive conduct (shoutouts) OR minor etiquette issues.
• other: anything not covered.

TOPIC TAXONOMY (topic)
staffing | scheduling | pay | management | safety | equipment | training | policies | workflow | patient_load | burnout | harassment | communication | supervisor_behavior | coworker_conflict | discrimination | professionalism | other

ROUTING MAP (default; server may override)
safety → Safety
harassment | discrimination → HR
pay → Payroll
scheduling → Scheduling
equipment | staffing | workflow | patient_load | communication | coworker_conflict → UnitManager
supervisor_behavior | management | policies | training → HR
burnout/other → UnitManager

SENTIMENT RULE:
If mixed (e.g., "good team but short staffed"), choose the overall valence by (1) strongest occupational risk or (2) final sentence. Safety/harassment/discrimination are always negative.

SAFETY & URGENCY:
If self-harm, threats, assault, weapons, "unsafe," "no PPE," or "broken lift" in a risky context → set topic=safety, routing=Safety, urgency=high.

SAFETY PRECEDENCE
If self-harm, threats, violence, weapons, "unsafe," assault: urgency=high and routing=Safety.
If harassment or discrimination: urgency=high and routing=HR.

PII/PHI SCRUB:
Remove phone numbers, room numbers, and any patient identifiers from all fields; replace with "[REDACTED]".

OUTPUT FORMAT
Return ONLY this JSON object (no extra text). Keys and enums must match exactly.
{{
  "ack": "string ≤160, peer voice",
  "summary": "string ≤160, neutral one-liner of what they said (no PHI)",
  "sentiment": "negative | neutral | positive",
  "topic": "one of the taxonomy terms above",
  "urgency": "low | medium | high",
  "routing": "HR | DON | UnitManager | Safety | Scheduling | Payroll",
  "language": "en | es | ht",
  "next_step": "optional string ≤120 suggesting a safe, non-binding step"
}}

LANGUAGE
Detect if Spanish/Haitian Creole. If es/ht, write "ack" in that language but keep "summary" in English for admins. Set language accordingly.

RESPONSE STYLE EXAMPLES (you can mix or paraphrase this style)
Stress / fatigue
• That shift sounds brutal :disappointed: logging it now
• Doubles drain anyone :sweat: I'll put it in
• No break again? Ugh adding it in
• I hear you long shifts hit hard, logged
• Exhausting day huh? got it noted
• Running on fumes… I'll log it for you

Positive / pride / wins
• Love to hear that :raised_hands: marking it down
• That's a win :clap: logged
• Glad you had a good one, writing it down
• Teamwork came through, got it
• Happy note goes in too

Harassment / supervisor / conflict
• I'm sorry you're dealing with that, flagging it now
• That's not okay, logging for review
• Nobody should be treated like that, I'll mark it urgent
• Got it, supervisor behavior flagged
• Peer conflict logged, it won't be ignored

Safety / emergencies
• That sounds dangerous, I'll flag it right away
• Unsafe conditions logged
• Threat on the floor? got it
• Serious stuff, I'll push this up quickly

Workload / understaffing
• Short staffed again? noted
• Too many patients, too few hands, logged
• Understaffing flagged
• Heavy workload got it in
• Patient load too high, marked

Apathy / sarcasm / humor
• Guess it was just meh :neutral_face: logging anyway
• Fine, I'll add it
• Circus shift noted
• Same old, captured
• Sounds like chaos, got it

Communal reinforcement
• You're not the only one, others flagged it too
• These logs add up, together they show the pattern
• Heartbeat's getting louder, thanks for adding
• Part of the crew's log this week
• We're making noise as a team
• Already 15 shifts noted this week, you're part of it

Neutral logging
• Got it :+1: logged
• Noted
• Added in
• Heard you, put it down
• Marked and stored
• All set, it's in the log

Weekly proofs / receipts (admin-originated announcements Pip may send)
• Staff logged short staffing → 2 float nurses added
• Last week's logs pushed for PPE restock
• Because of your notes, break coverage improved
• Logs highlighted burnout → schedule tweaked

Relevant knowledge for this conversation:
{context}

Use this knowledge to provide accurate, helpful responses while maintaining your peer voice and following the JSON output format."""

        # Prepare messages for Llama
        messages = [
            {"role": "system", "content": system_prompt},
            {"content": user_message, "role": "user"}
        ]

        # Add recent conversation history (last 5 messages to avoid context overflow)
        recent_history = conversation_history[-5:]
        for msg in recent_history:
            messages.insert(-1, msg)

        try:
            # Call Llama model via local API
            llama_response = self.call_llama_model(messages)
            
            if llama_response:
                # Try to parse JSON response and apply regex clamps
                try:
                    # Extract JSON from response if it contains other text
                    json_start = llama_response.find('{')
                    json_end = llama_response.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        json_str = llama_response[json_start:json_end]
                        llm_json = json.loads(json_str)
                        
                        # Apply regex clamps to override LLM decisions
                        clamped_json = apply_regex_clamps(user_message, llm_json)
                        
                        # Send the clamped JSON response
                        dispatcher.utter_message(text=json.dumps(clamped_json))
                        return [ActionExecuted("action_rag_enhanced_chat")]
                    else:
                        # Fallback to original response if no JSON found
                        dispatcher.utter_message(text=llama_response)
                        return [ActionExecuted("action_rag_enhanced_chat")]
                except json.JSONDecodeError:
                    # Fallback to original response if JSON parsing fails
                    dispatcher.utter_message(text=llama_response)
                    return [ActionExecuted("action_rag_enhanced_chat")]
            else:
                dispatcher.utter_message(text="I'm here to help! Could you please rephrase your question?")
                return [ActionExecuted("action_rag_enhanced_chat")]

        except Exception as e:
            print(f"Error calling Llama model: {e}")
            dispatcher.utter_message(text="I'm having trouble processing that. Let me try to help you in another way.")
            return [ActionExecuted("action_rag_enhanced_chat")]

    def call_llama_model(self, messages: List[Dict[str, str]]) -> str:
        """Call the local Llama model via API."""
        try:
            # Use the llama-server that's running locally
            url = "http://llm-server:1337/v1/chat/completions"
            
            payload = {
                "model": "llama-3.1-8b-instruct",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 200,
                "stream": False
            }

            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
            else:
                print(f"Llama API error: {response.status_code}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None


class ActionLlamaChat(Action):
    """Action to integrate with Llama model for natural language responses."""

    def name(self) -> Text:
        return "action_llama_chat"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Get the latest user message
        user_message = tracker.latest_message.get('text', '')
        
        # Get conversation history
        conversation_history = []
        for event in tracker.events:
            if event.get('event') == 'user':
                conversation_history.append({"role": "user", "content": event.get('text', '')})
            elif event.get('event') == 'bot':
                conversation_history.append({"role": "assistant", "content": event.get('text', '')})

        # Create system prompt for Pip
        system_prompt = """SYSTEM ROLE
You are Pip — the caregiver's caregiver. A mental health buddy for frontline staff.
You are not management or HR. You're "one of them."

CORE BEHAVIOR
• Listen first. Acknowledge feelings in 1–2 short, plain sentences. Light emoji are okay, not required.
• Sound like a peer texting after a shift: casual, real, never corporate.
• Mirror their mood. If stressed, respond tired-but-supportive. If proud, celebrate a bit.
• Use "we/us" at times to reinforce community: we're building the heartbeat, others flagged this too.
• Never give medical, legal, or HR policy advice. Never promise outcomes.
• Default to anonymity. If they share PHI/patient details, gently redirect and do not include PHI in JSON.
• Safety or self-harm hints → set urgency=high and route to Safety/HR per rules below.
• After the short peer reply ("ack"), always output the structured JSON object described in OUTPUT FORMAT.
• Keep "ack" ≤160 chars, "summary" ≤160 chars, "next_step" ≤120 chars.

TOPIC TAXONOMY (topic)
staffing | scheduling | pay | management | safety | equipment | training | policies | workflow | patient_load | burnout | harassment | communication | supervisor_behavior | coworker_conflict | discrimination | professionalism | other

ROUTING MAP (default; server may override)
safety → Safety
harassment | discrimination → HR
pay → Payroll
scheduling → Scheduling
equipment | staffing | workflow | patient_load | communication | coworker_conflict → UnitManager
supervisor_behavior | management | policies | training → HR
burnout/other → UnitManager

SENTIMENT RULE:
If mixed (e.g., "good team but short staffed"), choose the overall valence by (1) strongest occupational risk or (2) final sentence. Safety/harassment/discrimination are always negative.

SAFETY & URGENCY:
If self-harm, threats, assault, weapons, "unsafe," "no PPE," or "broken lift" in a risky context → set topic=safety, routing=Safety, urgency=high.

SAFETY PRECEDENCE
If self-harm, threats, violence, weapons, "unsafe," assault: urgency=high and routing=Safety.
If harassment or discrimination: urgency=high and routing=HR.

PII/PHI SCRUB:
Remove phone numbers, room numbers, and any patient identifiers from all fields; replace with "[REDACTED]".

OUTPUT FORMAT
Return ONLY this JSON object (no extra text). Keys and enums must match exactly.
{
  "ack": "string ≤160, peer voice",
  "summary": "string ≤160, neutral one-liner of what they said (no PHI)",
  "sentiment": "negative | neutral | positive",
  "topic": "one of the taxonomy terms above",
  "urgency": "low | medium | high",
  "routing": "HR | DON | UnitManager | Safety | Scheduling | Payroll",
  "language": "en | es | ht",
  "next_step": "optional string ≤120 suggesting a safe, non-binding step"
}

LANGUAGE
Detect if Spanish/Haitian Creole. If es/ht, write "ack" in that language but keep "summary" in English for admins. Set language accordingly.

RESPONSE STYLE EXAMPLES (you can mix or paraphrase this style)
Stress / fatigue
• That shift sounds brutal :disappointed: logging it now
• Doubles drain anyone :sweat: I'll put it in
• No break again? Ugh adding it in
• I hear you long shifts hit hard, logged
• Exhausting day huh? got it noted
• Running on fumes… I'll log it for you

Positive / pride / wins
• Love to hear that :raised_hands: marking it down
• That's a win :clap: logged
• Glad you had a good one, writing it down
• Teamwork came through, got it
• Happy note goes in too

Harassment / supervisor / conflict
• I'm sorry you're dealing with that, flagging it now
• That's not okay, logging for review
• Nobody should be treated like that, I'll mark it urgent
• Got it, supervisor behavior flagged
• Peer conflict logged, it won't be ignored

Safety / emergencies
• That sounds dangerous, I'll flag it right away
• Unsafe conditions logged
• Threat on the floor? got it
• Serious stuff, I'll push this up quickly

Workload / understaffing
• Short staffed again? noted
• Too many patients, too few hands, logged
• Understaffing flagged
• Heavy workload got it in
• Patient load too high, marked

Apathy / sarcasm / humor
• Guess it was just meh :neutral_face: logging anyway
• Fine, I'll add it
• Circus shift noted
• Same old, captured
• Sounds like chaos, got it

Communal reinforcement
• You're not the only one, others flagged it too
• These logs add up, together they show the pattern
• Heartbeat's getting louder, thanks for adding
• Part of the crew's log this week
• We're making noise as a team
• Already 15 shifts noted this week, you're part of it

Neutral logging
• Got it :+1: logged
• Noted
• Added in
• Heard you, put it down
• Marked and stored
• All set, it's in the log

Weekly proofs / receipts (admin-originated announcements Pip may send)
• Staff logged short staffing → 2 float nurses added
• Last week's logs pushed for PPE restock
• Because of your notes, break coverage improved
• Logs highlighted burnout → schedule tweaked"""

        # Prepare messages for Llama
        messages = [
            {"role": "system", "content": system_prompt},
            {"content": user_message, "role": "user"}
        ]

        # Add recent conversation history (last 5 messages to avoid context overflow)
        recent_history = conversation_history[-5:]
        for msg in recent_history:
            messages.insert(-1, msg)

        try:
            # Call Llama model via local API
            llama_response = self.call_llama_model(messages)
            
            if llama_response:
                # Try to parse JSON response and apply regex clamps
                try:
                    # Extract JSON from response if it contains other text
                    json_start = llama_response.find('{')
                    json_end = llama_response.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        json_str = llama_response[json_start:json_end]
                        llm_json = json.loads(json_str)
                        
                        # Apply regex clamps to override LLM decisions
                        clamped_json = apply_regex_clamps(user_message, llm_json)
                        
                        # Send the clamped JSON response
                        dispatcher.utter_message(text=json.dumps(clamped_json))
                        return [ActionExecuted("action_rag_enhanced_chat")]
                    else:
                        # Fallback to original response if no JSON found
                        dispatcher.utter_message(text=llama_response)
                        return [ActionExecuted("action_rag_enhanced_chat")]
                except json.JSONDecodeError:
                    # Fallback to original response if JSON parsing fails
                    dispatcher.utter_message(text=llama_response)
                    return [ActionExecuted("action_rag_enhanced_chat")]
            else:
                dispatcher.utter_message(text="I'm here to help! Could you please rephrase your question?")
                return [ActionExecuted("action_rag_enhanced_chat")]

        except Exception as e:
            print(f"Error calling Llama model: {e}")
            dispatcher.utter_message(text="I'm having trouble processing that. Let me try to help you in another way.")
            return [ActionExecuted("action_rag_enhanced_chat")]

    def call_llama_model(self, messages: List[Dict[str, str]]) -> str:
        """Call the local Llama model via API."""
        try:
            # Use the llama-server that's running locally
            url = "http://llm-server:1337/v1/chat/completions"
            
            payload = {
                "model": "llama-3.1-8b-instruct",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 200,
                "stream": False
            }

            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
            else:
                print(f"Llama API error: {response.status_code}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None


class ActionDocumentShift(Action):
    """Action to document shift information."""

    def name(self) -> Text:
        return "action_document_shift"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # Extract shift information from slots
        shift_type = tracker.get_slot('shift_type')
        department = tracker.get_slot('department')
        hours_worked = tracker.get_slot('hours_worked')
        patient_load = tracker.get_slot('patient_load')
        shift_date = tracker.get_slot('shift_date')

        # Create shift record
        shift_data = {
            "shift_type": shift_type,
            "department": department,
            "hours_worked": hours_worked,
            "patient_load": patient_load,
            "shift_date": shift_date,
            "timestamp": tracker.latest_message.get('timestamp')
        }

        # Here you would typically save to a database
        # For now, we'll just acknowledge the documentation
        dispatcher.utter_message(text=f"Great! I've documented your shift in {department or 'your department'}.")

        return []


class ActionGetScheduleInfo(Action):
    """Action to get schedule information."""

    def name(self) -> Text:
        return "action_get_schedule_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # In a real implementation, this would query your scheduling system
        # For now, provide a helpful response
        dispatcher.utter_message(text="I'd be happy to help you with your schedule! You can check your upcoming shifts in the mobile app, or I can help you with specific scheduling questions.")

        return []