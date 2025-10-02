from typing import Any, Text, Dict, List
import requests
import json
import os
import sys
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

try:
    from rag_service import rag_service
    RAG_AVAILABLE = True
except ImportError as e:
    print(f"RAG service not available: {e}")
    RAG_AVAILABLE = False


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

SAFETY PRECEDENCE
If self-harm, threats, violence, weapons, "unsafe," assault: urgency=high and routing=Safety.
If harassment or discrimination: urgency=high and routing=HR.

PII/PHI SCRUB
Remove phone numbers, room numbers, patient names/details from all fields. Replace with "[REDACTED]".

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
                dispatcher.utter_message(text=llama_response)
            else:
                dispatcher.utter_message(text="I'm here to help! Could you please rephrase your question?")

        except Exception as e:
            print(f"Error calling Llama model: {e}")
            dispatcher.utter_message(text="I'm having trouble processing that. Let me try to help you in another way.")

        return []

    def call_llama_model(self, messages: List[Dict[str, str]]) -> str:
        """Call the local Llama model via API."""
        try:
            # Use the llama-server that's running locally
            url = "http://localhost:1337/v1/chat/completions"
            
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

SAFETY PRECEDENCE
If self-harm, threats, violence, weapons, "unsafe," assault: urgency=high and routing=Safety.
If harassment or discrimination: urgency=high and routing=HR.

PII/PHI SCRUB
Remove phone numbers, room numbers, patient names/details from all fields. Replace with "[REDACTED]".

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
                dispatcher.utter_message(text=llama_response)
            else:
                dispatcher.utter_message(text="I'm here to help! Could you please rephrase your question?")

        except Exception as e:
            print(f"Error calling Llama model: {e}")
            dispatcher.utter_message(text="I'm having trouble processing that. Let me try to help you in another way.")

        return []

    def call_llama_model(self, messages: List[Dict[str, str]]) -> str:
        """Call the local Llama model via API."""
        try:
            # Use the llama-server that's running locally
            url = "http://localhost:1337/v1/chat/completions"
            
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