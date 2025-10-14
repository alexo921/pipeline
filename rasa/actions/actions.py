from typing import Any, Text, Dict, List
import requests
import json
import os
import sys
import re
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, ActionExecuted

# Routing Gazetteer - decouple routing from topic
ROUTING_GAZETTEER = {
    "Payroll": r"\b(payroll|paycheck|W-2|W2|direct deposit|paystub|pay stub|wage|salary|compensation|missing pay|unpaid|underpaid)\b",
    "Scheduling": r"\b(scheduler|scheduling office|schedule posted|shift swap|time off request|PTO request|coverage request|availability)\b",
    "HR": r"\b(HR|human resources|harassment|discrimination|supervisor behavior|manager behavior|complaint|grievance|retaliation|hostile)\b",
    "Safety": r"\b(safety officer|EHS|security|unsafe|injury|accident|incident report|violence|threat|assault|weapon|panic button|code gray)\b",
}

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
    # Safety first (expanded for better recall)
    (r"\b(threat|threatened|unsafe|assault|weapon|violence|no ppe|broken lift|panic button|security escort|code gray|elopement|combative|sharps left out|needle stick|exposure|violent patient|aggression|attack)\b",
     {"topic": "safety", "routing": "Safety", "urgency": "high", "sentiment": "negative"}),
    # Enhanced patient load vs staffing detection
    (r"\b(\d{1,2}\s?(patients|pts?)|alone on|double (shift|load)|too many patients|overwhelming patient load|patient ratio|patient assignment|had \d+|with \d+ patients)\b",
     {"topic": "patient_load"}),
    (r"\b(short staffed|understaffed|call[- ]?outs?|float coverage|not enough staff|falta personal|sin personal|personal insuficiente|cobertura insuficiente|no hay suficiente personal|staffing issues|coverage issues)\b",
     {"topic": "staffing", "urgency": "medium"}),
    # Communication vs coworker vs supervisor
    (r"\b(handoff|ignored (notes|handoff)|no updates|unclear instructions)\b",
     {"topic": "communication"}),
    (r"\b(roll(ing)? eyes|gossip|refus(ing|ed) help|passive[- ]?aggressive)\b",
     {"topic": "coworker_conflict"}),
    (r"\b(charge nurse|supervisor|manager|lead|retaliat|belittle|favoritism)\b",
     {"topic": "supervisor_behavior", "routing": "HR"}),
    # Pay & scheduling (enhanced)
    (r"\b(overtime|OT|paycheck|rate|bonus|pago|cheque|pay)\b", {"topic": "pay", "routing": "Payroll"}),
    (r"\b(no apareció|missing|falta|didn't show|not showing)\b.*\b(paycheck|cheque|ot|overtime|pay)\b", 
     {"topic": "pay", "sentiment": "negative", "urgency": "medium", "routing": "Payroll"}),
    (r"\b(schedule|posted late|swap|time off|pto request|necesito libre|libre el|no sale en el horario|schedule change|shift change|schedule posted|horario)\b", 
     {"topic": "scheduling", "routing": "Scheduling"}),
    # Management & leadership (enhanced)
    (r"\b(leadership|management|rules|policy|changing rules|mid-shift|admin|administration|director|executive|boss|leadership team|policy change|rule change|policies|procedure|protocol)\b", 
     {"topic": "policies", "routing": "HR"}),
    # Workflow patterns
    (r"\b(workflow|process|duplicate forms|chaotic intake|paperwork|forms|procedures|process friction|workflow issues)\b",
     {"topic": "workflow", "routing": "UnitManager"}),
    # Burnout & workload
    (r"\b(burned out|burnout|overworked|exhausted|tired|drained|overwhelmed|stressed|can't handle|breaking point|too much)\b",
     {"topic": "burnout"}),
    # Equipment & supplies (enhanced)
    (r"\b(broken (lift|pump|equipment)|no gloves|equipment (down|broken)|malfunction(ing)?|lift.*broken|pump.*failing|out of stock|missing supplies|equipment issues|equipo peligroso|equipment dangerous|unsafe equipment|gloves.*stock|supplies.*stock)\b",
     {"topic": "equipment", "sentiment": "negative"}),
    # Training patterns
    (r"\b(no one showed me|didn't show me|training|protocol|wound care|new procedure|didn't teach|no training|show me how|learn|coaching|instruction)\b",
     {"topic": "training", "routing": "HR"}),
    # Harassment / discrimination keywords
    (r"\b(harass(ed|ment)|slur|racis\w*|sexis\w*|homophob\w*|used slurs)\b",
     {"topic": "harassment", "routing": "HR", "urgency": "high"}),
    (r"\b(discriminat\w+|ageism|biased|bias|comment about my age|unfairly because of my accent)\b",
     {"topic": "discrimination", "routing": "HR", "urgency": "high"}),
    # Enhanced sentiment detection patterns
    (r"\b(exhausted|burned? out|overwhelmed|stressed|tired|drained|frustrated|angry|upset|worried|anxious|concerned|problem|issue|complaint|difficult|hard|struggling|failing|broken|wrong|bad|terrible|awful|horrible|nightmare|chaos|crisis|emergency|urgent|critical|serious)\b",
     {"sentiment": "negative"}),
    # Urgency escalation patterns (refined - less aggressive)
    (r"\b(short staffed again|understaffed again|falta personal otra vez)\b",
     {"urgency": "medium"}),
    (r"\b(schedule posted late again|horario tarde otra vez|necesito libre.*otra vez|time off.*again)\b",
     {"urgency": "medium"}),
    # More specific urgency triggers
    (r"\b(can't swap|unable to swap|no one to cover)\b.*\b(shift|turno)\b",
     {"urgency": "medium"}),
    (r"\b(equipment.*dangerous|equipo peligroso|unsafe.*equipment|dangerous.*equipment)\b",
     {"urgency": "high", "topic": "safety", "routing": "Safety"}),
    # More urgency triggers
    (r"\b(repeatedly|constantly|always|every time|keep happening|ongoing|persistent)\b",
     {"urgency": "medium"}),
    (r"\b(urgent|critical|emergency|immediate|asap|right away|needs immediate)\b",
     {"urgency": "high"}),
    (r"\b(short staffed|understaffed|call[- ]?outs?|no coverage|alone|overworked|double shift|triple|too many patients|overwhelming|impossible|can't handle|breaking point)\b",
     {"sentiment": "negative"}),
    (r"\b(great|excellent|wonderful|amazing|fantastic|proud|happy|good|positive|success|saved|helped|improved|better|good shift|great day|love|appreciate|thankful|grateful)\b",
     {"sentiment": "positive"}),
    # Enhanced multilingual sentiment patterns
    (r"\b(cansado|agotado|estresado|problema|difícil|malo|terrible|horrible|pesadilla|caos|emergencia|urgente|crítico|serio|falta personal|sin personal|sobrecargado|agobiado|frustrado|molesto|preocupado|ansioso|angustiado|desesperado|imposible|difícil|duro|luchando|fracasando|roto|mal|terrible|horrible|pesadilla|caos|crisis|urgente|crítico|serio|necesito libre|no sale en el horario|libre el|horario|no sale|sábado|no apareció|missing|falta)\b",
     {"sentiment": "negative"}),
    (r"\b(genial|excelente|maravilloso|fantástico|orgulloso|feliz|bueno|positivo|éxito|salvé|ayudé|mejoré|mejor|buen turno|gran día|amo|agradecido)\b",
     {"sentiment": "positive"}),
    # Specific sentiment overrides for edge cases
    (r"\b(posted late|tarde|late)\b", {"sentiment": "negative"}),
    (r"\b(everyone exhausted|todos cansados|all exhausted)\b", {"sentiment": "negative"}),
    (r"\b(neutral|normal|regular|fine|okay|ok)\b", {"sentiment": "neutral"}),
    # More aggressive sentiment detection
    (r"\b(problem|issue|complaint|difficult|hard|struggling|failing|broken|wrong|bad|terrible|awful|horrible|nightmare|chaos|crisis|emergency|urgent|critical|serious)\b",
     {"sentiment": "negative"}),
    (r"\b(good|great|excellent|wonderful|amazing|fantastic|proud|happy|positive|success|saved|helped|improved|better|love|appreciate|thankful|grateful)\b",
     {"sentiment": "positive"}),
    # Safety/urgent topics always negative
    (r".*", {"sentiment": "negative"}, ["safety","harassment","discrimination"]),  # if topic is any of these
    
    # COMBINATION PATTERNS (keyword pairs for higher accuracy)
    # Pay combinations
    (r"\b(no apareció|missing|falta).*(ot|overtime|paycheck|cheque|pay)\b", 
     {"topic": "pay", "sentiment": "negative", "urgency": "medium", "routing": "Payroll"}),
    (r"\b(ot|overtime|pay).*(no apareció|missing|falta|wrong|incorrect)\b", 
     {"topic": "pay", "sentiment": "negative", "urgency": "medium", "routing": "Payroll"}),
    
    # Staffing + patient load combinations
    (r"\b(short staffed|understaffed|falta personal).*(patients|patient load|alone)\b", 
     {"topic": "patient_load", "sentiment": "negative", "urgency": "medium"}),
    (r"\b(\d+\s*patients?).*(short staffed|understaffed|alone|no help)\b", 
     {"topic": "patient_load", "sentiment": "negative", "urgency": "medium"}),
    
    # Equipment + safety combinations
    (r"\b(broken|malfunctioning|failing).*(lift|pump|equipment).*(unsafe|dangerous|risk)\b", 
     {"topic": "safety", "sentiment": "negative", "urgency": "high", "routing": "Safety"}),
    (r"\b(no|missing|out of).*(ppe|gloves|masks).*(unsafe|exposed|risk)\b", 
     {"topic": "safety", "sentiment": "negative", "urgency": "high", "routing": "Safety"}),
    
    # Supervisor + harassment combinations
    (r"\b(charge nurse|supervisor|manager).*(belittle|threaten|harass|retaliat)\b", 
     {"topic": "supervisor_behavior", "sentiment": "negative", "urgency": "high", "routing": "HR"}),
    (r"\b(belittle|threaten|harass|retaliat).*(charge nurse|supervisor|manager)\b", 
     {"topic": "supervisor_behavior", "sentiment": "negative", "urgency": "high", "routing": "HR"}),
    
    # Schedule + urgency combinations
    (r"\b(schedule|horario).*(posted late|tarde).*(again|otra vez)\b", 
     {"topic": "scheduling", "sentiment": "negative", "urgency": "medium", "routing": "Scheduling"}),
    (r"\b(can't|unable|no puedo).*(swap|change|cambiar).*(shift|turno)\b", 
     {"topic": "scheduling", "sentiment": "negative", "urgency": "medium", "routing": "Scheduling"}),
    
    # Burnout + workload combinations  
    (r"\b(burned out|exhausted|agotado).*(every|always|constantly|siempre)\b", 
     {"topic": "burnout", "sentiment": "negative", "urgency": "medium"}),
    (r"\b(double|triple|multiple).*(shift|turno).*(exhausted|tired|cansado)\b", 
     {"topic": "burnout", "sentiment": "negative", "urgency": "medium"}),
    
    # TOP CONFUSION FIXES (Phase 3 - expanded)
    # 1. Workflow vs Pay disambiguation
    (r"\b(process|paperwork|forms|documentation).*(pay|paycheck|payment)\b", 
     {"topic": "workflow", "sentiment": "negative", "urgency": "low"}),
    (r"\b(timesheet|time card|clock|punch).*(process|system|workflow)\b", 
     {"topic": "workflow", "urgency": "low"}),
    
    # 2. Communication detection (enhanced)
    (r"\b(handoff|report|updates|briefing|told|said|informed|communicate|information|message)\b", 
     {"topic": "communication", "urgency": "low"}),
    (r"\b(didn't tell|no one told|wasn't informed|lack of communication|poor communication)\b", 
     {"topic": "communication", "sentiment": "negative", "urgency": "low"}),
    (r"\b(notes|charting|documentation).*(incomplete|missing|unclear|confusing)\b", 
     {"topic": "communication", "sentiment": "negative"}),
    
    # 3. Coworker conflict detection (enhanced)
    (r"\b(coworker|colleague|peer|teammate|CNA|nurse).*(rude|conflict|argument|disagree|tension|ignored|dismissive)\b", 
     {"topic": "coworker_conflict", "sentiment": "negative", "urgency": "low"}),
    (r"\b(gossip|rumors|clique|exclude|ostracize|cold shoulder)\b", 
     {"topic": "coworker_conflict", "sentiment": "negative"}),
    (r"\b(refused to help|won't help|didn't help|no teamwork)\b", 
     {"topic": "coworker_conflict", "sentiment": "negative"}),
    
    # 4. Equipment detection (expanded)
    (r"\b(bed|wheelchair|walker|monitor|device|machine|computer|system).*(broken|not working|malfunction|down|failed)\b", 
     {"topic": "equipment", "sentiment": "negative", "urgency": "low"}),
    (r"\b(IV pump|lift|hoyer|vital signs|thermometer|BP cuff).*(broken|down|not working)\b", 
     {"topic": "equipment", "sentiment": "negative"}),
    (r"\b(equipment|supplies|stock).*(out of|missing|shortage|low)\b", 
     {"topic": "equipment", "sentiment": "negative"}),
    
    # 5. Policies vs Management disambiguation
    (r"\b(policy|policies|procedure|procedures|protocol).*(change|changed|new|update)\b", 
     {"topic": "policies", "urgency": "low"}),
    (r"\b(management|leadership|admin|administration|director).*(decision|chose|decided)\b", 
     {"topic": "management", "urgency": "low"}),
    (r"\b(rule|rules).*(change|different|inconsistent|arbitrary)\b", 
     {"topic": "policies", "sentiment": "negative"}),
    
    # 6. Burnout vs Other
    (r"\b(mental health|emotional|drained|can't anymore|breaking down)\b", 
     {"topic": "burnout", "sentiment": "negative", "urgency": "medium"}),
    
    # 7. Training detection
    (r"\b(orientation|onboarding|preceptor|train|trained|training).*(lack|poor|insufficient|no)\b", 
     {"topic": "training", "sentiment": "negative", "routing": "HR"}),
    
    # 8. Recurrence urgency boost
    (r"\b(again|still|yet again|once more|repeatedly|keep happening|ongoing|persistent)\b", 
     {"urgency": "medium"}),
    
    # CONTEXT-AWARE URGENCY DETECTION (Phase 3)
    # High urgency patterns
    (r"\b(immediate|right now|asap|urgent|critical|emergency|911|code)\b", 
     {"urgency": "high"}),
    (r"\b(threat|violence|assault|attack|weapon|gun|knife)\b", 
     {"urgency": "high", "topic": "safety", "routing": "Safety"}),
    (r"\b(injury|injured|hurt|bleeding|fell|fall|accident)\b", 
     {"urgency": "high"}),
    (r"\b(suicide|kill myself|harm myself|end it|can't go on)\b", 
     {"urgency": "high", "topic": "safety", "routing": "Safety"}),
    
    # Medium urgency patterns
    (r"\b(missing|didn't receive|haven't gotten).*(pay|paycheck|overtime|bonus)\b", 
     {"urgency": "medium", "topic": "pay"}),
    (r"\b(short staffed|understaffed).*(today|now|currently|right now)\b", 
     {"urgency": "medium"}),
    (r"\b(broken|not working|down).*(critical|important|needed|essential)\b", 
     {"urgency": "medium"}),
    (r"\b(harassment|harassed|discriminat|retaliat).*(ongoing|continues|still)\b", 
     {"urgency": "high", "routing": "HR"}),
    
    # Low urgency (informational)
    (r"^\s*(when|what|how|where|who|can you|could you|would you)\b", 
     {"urgency": "low"}),
    (r"\b(question|wondering|curious|ask about|inquire)\b", 
     {"urgency": "low"}),
    
    # AGGRESSIVE SENTIMENT DETECTION (Phase 2 & 3)
    # Strong negative indicators - Emotional states
    (r"\b(exhausted|burned out|overwhelmed|stressed|tired|drained|frustrated|angry|upset|worried|anxious)\b", 
     {"sentiment": "negative"}),
    (r"\b(problem|issue|complaint|difficult|hard|struggling|failing|broken|wrong|bad|terrible|awful|horrible)\b", 
     {"sentiment": "negative"}),
    (r"\b(nightmare|chaos|crisis|emergency|urgent|critical|serious|dangerous|unsafe)\b", 
     {"sentiment": "negative"}),
    (r"\b(short staffed|understaffed|alone|overworked|no break|no help|impossible|can't handle)\b", 
     {"sentiment": "negative"}),
    
    # Healthcare-specific negative patterns (20 new)
    (r"\b(no support|unsupported|left alone|abandoned|ignored|dismissed|no one cares)\b", 
     {"sentiment": "negative"}),
    (r"\b(underpaid|unpaid|wage|salary|compensation).*(issue|problem|wrong|missing|low)\b", 
     {"sentiment": "negative"}),
    (r"\b(mandatory|forced|required).*(overtime|extra|double|stay)\b", 
     {"sentiment": "negative"}),
    (r"\b(call off|called off|sick|absent).*(again|still|repeatedly|constantly)\b", 
     {"sentiment": "negative"}),
    (r"\b(disrespect|unprofessional|inappropriate|unacceptable|inappropriate behavior)\b", 
     {"sentiment": "negative"}),
    (r"\b(late|delayed|waiting|wait).*(break|lunch|relief|coverage)\b", 
     {"sentiment": "negative"}),
    (r"\b(missing|lost|stolen|disappeared).*(supplies|equipment|tools|items)\b", 
     {"sentiment": "negative"}),
    (r"\b(never|always|nobody|nothing).*(help|support|listen|respond|care)\b", 
     {"sentiment": "negative"}),
    (r"\b(yell|yelled|shouted|scream|raised voice|snapped at)\b", 
     {"sentiment": "negative"}),
    (r"\b(blame|blamed|fault|accused|pointed finger)\b", 
     {"sentiment": "negative"}),
    (r"\b(unfair|unjust|biased|favored|favoritism|preferential)\b", 
     {"sentiment": "negative"}),
    (r"\b(quit|quitting|leave|resign|done|had enough|can't take)\b", 
     {"sentiment": "negative"}),
    (r"\b(sick|ill|injured|hurt|pain|ache).*(from|because|due to).*(work|shift|job)\b", 
     {"sentiment": "negative"}),
    (r"\b(mandatory|forced).*(meeting|training|overtime|stay late)\b", 
     {"sentiment": "negative"}),
    (r"\b(no time|not enough time|rushed|hurried|running behind)\b", 
     {"sentiment": "negative"}),
    (r"\b(neglect|neglected|overlooked|forgotten|missed)\b", 
     {"sentiment": "negative"}),
    (r"\b(deny|denied|rejected|refused).*(request|time off|pto|vacation)\b", 
     {"sentiment": "negative"}),
    (r"\b(every day|daily|constantly|all the time).*(same|problem|issue)\b", 
     {"sentiment": "negative"}),
    (r"\b(cry|crying|cried|tears|emotional breakdown)\b", 
     {"sentiment": "negative"}),
    (r"\b(unsafe|hazard|risk|danger|threatening|threat)\b", 
     {"sentiment": "negative"}),
    
    # Strong positive indicators  
    (r"\b(great|excellent|wonderful|amazing|fantastic|proud|happy|good|positive|success)\b", 
     {"sentiment": "positive"}),
    (r"\b(saved|helped|improved|better|love|appreciate|thankful|grateful|well done)\b", 
     {"sentiment": "positive"}),
    (r"\b(smooth|easy|calm|peaceful|quiet|manageable|handled|under control)\b", 
     {"sentiment": "positive"}),
    (r"\b(thank|thanks|appreciate|recognition|recognized|acknowledged)\b", 
     {"sentiment": "positive"}),
    (r"\b(teamwork|team|support|supported|backing|help|helped)\b", 
     {"sentiment": "positive"}),
    
    # Neutral overrides (only when truly neutral)
    (r"^\s*(schedule|when|what|how|where|who)\s", 
     {"sentiment": "neutral"}),
]

def apply_routing_gazetteer(text: str, result: Dict) -> Dict:
    """Apply routing gazetteer as second pass - decouple routing from topic."""
    text_lower = text.lower()
    
    # Check routing gazetteer patterns (highest priority first)
    for routing_dept, pattern in ROUTING_GAZETTEER.items():
        if re.search(pattern, text_lower, re.IGNORECASE):
            result["routing"] = routing_dept
            return result
    
    # If no gazetteer match, keep current routing
    return result


def apply_regex_clamps(text: str, llm_response: Dict) -> Dict:
    """Apply regex clamps to override LLM decisions with confident pattern matches.
    
    Uses priority-based ordering and confidence scoring for better accuracy.
    """
    text_lower = text.lower()
    result = llm_response.copy()
    
    # Ensure all required keys exist with valid defaults
    required_keys = {
        "ack": "I hear you and I'm here to support you.",
        "summary": "Message about healthcare workplace concerns",
        "sentiment": "neutral",
        "topic": "other",
        "urgency": "low",
        "routing": "UnitManager",
        "language": "en",
        "next_step": "I'll connect you with the right person to help."
    }
    
    # Fill in missing keys with defaults
    for key, default_value in required_keys.items():
        if key not in result or not result[key]:
            result[key] = default_value
    
    # Validate enum values
    valid_sentiments = ["negative", "neutral", "positive"]
    valid_urgencies = ["low", "medium", "high"]
    valid_routings = ["HR", "DON", "UnitManager", "Safety", "Scheduling", "Payroll"]
    valid_languages = ["en", "es", "ht"]
    valid_topics = ["staffing", "scheduling", "pay", "management", "safety", "equipment", 
                   "training", "policies", "workflow", "patient_load", "burnout", "harassment", 
                   "communication", "supervisor_behavior", "coworker_conflict", "discrimination", 
                   "professionalism", "other"]
    
    if result.get("sentiment") not in valid_sentiments:
        result["sentiment"] = "neutral"
    if result.get("urgency") not in valid_urgencies:
        result["urgency"] = "low"
    if result.get("routing") not in valid_routings:
        result["routing"] = "UnitManager"
    if result.get("language") not in valid_languages:
        result["language"] = "en"
    if result.get("topic") not in valid_topics:
        result["topic"] = "other"
    
    # PRIORITY-BASED CLAMP ORDERING (highest priority first)
    # This ensures critical classifications (safety, harassment) override less important ones
    
    # Priority 1: Complete Pattern Override (highest confidence matches)
    result = apply_complete_pattern_override(text, result)
    
    # Priority 2: Regex Clamps (strong pattern matches - excluding sentiment)
    confidence_threshold = 0.5  # Lowered to apply more pattern overrides
    for pattern, overrides, *conditions in CLAMPS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            # Calculate confidence based on pattern specificity
            confidence = calculate_pattern_confidence(pattern, text_lower, overrides)
            
            if confidence >= confidence_threshold:
                # Check conditions for sentiment clamp
                if len(conditions) > 0 and conditions[0]:
                    required_topics = conditions[0]
                    if result.get("topic") in required_topics:
                        result.update(overrides)
                else:
                    # Apply override for regular clamps
                    result.update(overrides)
    
    # Priority 3: Aggressive Post-Processing (contextual refinement)
    result = apply_aggressive_post_processing(text, result)
    
    # Priority 4: Advanced Sentiment Analysis (FINAL override - always wins)
    result = apply_advanced_sentiment_analysis(text, result)
    
    # Priority 5: Routing Gazetteer (decouple routing from topic - final routing decision)
    result = apply_routing_gazetteer(text, result)
    
    return result


def calculate_pattern_confidence(pattern: str, text: str, overrides: Dict) -> float:
    """Calculate confidence score for a pattern match (0.0 to 1.0).
    
    Higher confidence for:
    - More specific patterns (longer, more keywords)
    - Safety/harassment patterns (critical)
    - Multiple field overrides (comprehensive)
    """
    confidence = 0.5  # Base confidence
    
    # Increase confidence for critical topics
    if 'topic' in overrides:
        if overrides['topic'] in ['safety', 'harassment', 'discrimination']:
            confidence += 0.3
        elif overrides['topic'] in ['staffing', 'patient_load', 'pay']:
            confidence += 0.2
    
    # Increase confidence for specific patterns (more keywords)
    pattern_words = len(pattern.split('|'))
    if pattern_words > 5:
        confidence += 0.2
    elif pattern_words > 3:
        confidence += 0.1
    
    # Increase confidence for multiple field overrides
    if len(overrides) > 2:
        confidence += 0.1
    
    # Cap at 1.0
    return min(confidence, 1.0)


def apply_aggressive_post_processing(text: str, result: Dict) -> Dict:
    """Apply aggressive post-processing to override LLM decisions with high confidence."""
    text_lower = text.lower()
    
    # Negative sentiment indicators (very strong)
    negative_indicators = [
        'exhausted', 'burned out', 'overwhelmed', 'stressed', 'tired', 'drained', 
        'frustrated', 'angry', 'upset', 'worried', 'anxious', 'concerned', 
        'problem', 'issue', 'complaint', 'difficult', 'hard', 'struggling', 
        'failing', 'broken', 'wrong', 'bad', 'terrible', 'awful', 'horrible', 
        'nightmare', 'chaos', 'crisis', 'emergency', 'urgent', 'critical', 'serious',
        'short staffed', 'understaffed', 'call-outs', 'no coverage', 'alone', 
        'overworked', 'double shift', 'triple', 'too many patients', 'overwhelming', 
        'impossible', 'can\'t handle', 'breaking point', 'everyone exhausted',
        'cansado', 'agotado', 'estresado', 'problema', 'difícil', 'malo', 
        'terrible', 'horrible', 'pesadilla', 'caos', 'emergencia', 'urgente', 
        'crítico', 'serio', 'falta personal', 'sin personal', 'sobrecargado',
        'posted late', 'tarde', 'late'
    ]
    
    # Positive sentiment indicators (very strong)
    positive_indicators = [
        'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'proud', 
        'happy', 'good', 'positive', 'success', 'saved', 'helped', 'improved', 
        'better', 'good shift', 'great day', 'love', 'appreciate', 'thankful', 
        'grateful', 'genial', 'excelente', 'maravilloso', 'fantástico', 
        'orgulloso', 'feliz', 'bueno', 'positivo', 'éxito', 'salvé', 'ayudé', 
        'mejoré', 'mejor', 'buen turno', 'gran día', 'amo', 'agradecido'
    ]
    
    # Check for sentiment indicators and force sentiment
    has_negative = any(indicator in text_lower for indicator in negative_indicators)
    has_positive = any(indicator in text_lower for indicator in positive_indicators)
    
    if has_negative and not has_positive:
        result['sentiment'] = 'negative'
    elif has_positive and not has_negative:
        result['sentiment'] = 'positive'
    
    # Force topic based on strong indicators
    if any(word in text_lower for word in ['short staffed', 'understaffed', 'falta personal', 'sin personal']):
        result['topic'] = 'staffing'
        if 'again' in text_lower or 'otra vez' in text_lower:
            result['urgency'] = 'medium'
    elif any(word in text_lower for word in ['patients', 'alone', 'patient load']) or re.search(r'\d+\s*patients?', text_lower):
        result['topic'] = 'patient_load'
    elif any(word in text_lower for word in ['schedule', 'posted late', 'necesito libre', 'horario']):
        result['topic'] = 'scheduling'
        result['routing'] = 'Scheduling'
    elif any(word in text_lower for word in ['leadership', 'management', 'rules', 'policy']):
        result['topic'] = 'management'
        result['routing'] = 'HR'
    elif any(word in text_lower for word in ['burned out', 'burnout', 'overworked']):
        result['topic'] = 'burnout'
    elif any(word in text_lower for word in ['broken', 'equipment', 'lift', 'pump']):
        result['topic'] = 'equipment'
    
    return result


def apply_complete_pattern_override(text: str, result: Dict) -> Dict:
    """Complete pattern-based override system that bypasses LLM for maximum accuracy."""
    text_lower = text.lower()
    
    # Safety patterns (highest priority)
    if any(word in text_lower for word in ['threat', 'threatened', 'unsafe', 'assault', 'weapon', 'violence', 'no ppe', 'broken lift']):
        result.update({
            'sentiment': 'negative',
            'topic': 'safety',
            'urgency': 'high',
            'routing': 'Safety'
        })
        return result
    
    # Harassment/Discrimination patterns
    if any(word in text_lower for word in ['harass', 'slur', 'racist', 'sexist', 'homophob', 'discriminat', 'ageism', 'biased']):
        result.update({
            'sentiment': 'negative',
            'topic': 'harassment' if any(word in text_lower for word in ['harass', 'slur', 'racist', 'sexist', 'homophob']) else 'discrimination',
            'urgency': 'high',
            'routing': 'HR'
        })
        return result
    
    # Staffing patterns
    if any(word in text_lower for word in ['short staffed', 'understaffed', 'falta personal', 'sin personal', 'call-outs', 'no coverage']):
        urgency = 'medium' if 'again' in text_lower or 'otra vez' in text_lower else 'low'
        result.update({
            'sentiment': 'negative',
            'topic': 'staffing',
            'urgency': urgency,
            'routing': 'UnitManager'
        })
        return result
    
    # Patient load patterns
    if any(word in text_lower for word in ['patients', 'alone', 'patient load']) or re.search(r'\d+\s*patients?', text_lower):
        result.update({
            'sentiment': 'negative',
            'topic': 'patient_load',
            'urgency': 'low',
            'routing': 'UnitManager'
        })
        return result
    
    # Scheduling patterns (enhanced)
    if any(word in text_lower for word in ['schedule', 'posted late', 'necesito libre', 'horario', 'time off', 'pto', 'swap', 'shift']):
        # More nuanced urgency detection
        urgency = 'low'
        if 'again' in text_lower or 'otra vez' in text_lower:
            urgency = 'medium'
        elif any(word in text_lower for word in ['can\'t swap', 'unable to swap', 'no one to cover']):
            urgency = 'medium'
        
        # More nuanced sentiment detection
        sentiment = 'neutral'
        negative_words = ['late', 'tarde', 'problem', 'issue', 'no sale', 'sábado', 'can\'t', 'unable', 'asking']
        if any(word in text_lower for word in negative_words):
            sentiment = 'negative'
        
        result.update({
            'sentiment': sentiment,
            'topic': 'scheduling',
            'urgency': urgency,
            'routing': 'Scheduling'
        })
        return result
    
    # Management & policies patterns
    if any(word in text_lower for word in ['leadership', 'management', 'rules', 'policy', 'admin', 'policies', 'procedure', 'protocol']):
        result.update({
            'sentiment': 'negative' if 'changing' in text_lower else 'neutral',
            'topic': 'policies',
            'urgency': 'low',
            'routing': 'HR'
        })
        return result
    
    # Workflow patterns
    if any(word in text_lower for word in ['workflow', 'process', 'duplicate forms', 'chaotic intake', 'paperwork', 'forms', 'procedures', 'process friction']):
        result.update({
            'sentiment': 'negative',
            'topic': 'workflow',
            'urgency': 'low',
            'routing': 'UnitManager'
        })
        return result
    
    # Burnout patterns
    if any(word in text_lower for word in ['burned out', 'burnout', 'overworked', 'exhausted', 'tired', 'drained']):
        result.update({
            'sentiment': 'negative',
            'topic': 'burnout',
            'urgency': 'low',
            'routing': 'UnitManager'
        })
        return result
    
    # Equipment patterns (enhanced)
    if any(word in text_lower for word in ['broken', 'equipment', 'lift', 'pump', 'malfunction', 'gloves', 'stock', 'supplies']):
        urgency = 'high' if any(word in text_lower for word in ['dangerous', 'peligroso', 'unsafe']) else 'low'
        routing = 'Safety' if urgency == 'high' else 'UnitManager'
        result.update({
            'sentiment': 'negative',
            'topic': 'safety' if urgency == 'high' else 'equipment',
            'urgency': urgency,
            'routing': routing
        })
        return result
    
    # Training patterns
    if any(word in text_lower for word in ['no one showed me', 'didn\'t show me', 'training', 'protocol', 'wound care', 'new procedure', 'didn\'t teach', 'no training', 'show me how', 'learn', 'coaching', 'instruction']):
        result.update({
            'sentiment': 'negative',
            'topic': 'training',
            'urgency': 'low',
            'routing': 'HR'
        })
        return result
    
    # Pay patterns (enhanced)
    if any(word in text_lower for word in ['overtime', 'ot', 'paycheck', 'rate', 'bonus', 'pay', 'pago', 'cheque']):
        # Check for negative indicators
        negative_indicators = ['missing', 'no apareció', 'falta', 'didn\'t show', 'not showing', 'problem', 'issue', 'wrong']
        has_negative = any(word in text_lower for word in negative_indicators)
        
        result.update({
            'sentiment': 'negative' if has_negative else 'neutral',
            'topic': 'pay',
            'urgency': 'medium' if has_negative else 'low',
            'routing': 'Payroll'
        })
        return result
    
    # Positive patterns
    if any(word in text_lower for word in ['great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'proud', 'happy', 'good', 'success', 'saved', 'helped', 'improved', 'better', 'love', 'appreciate', 'thankful', 'grateful']):
        result.update({
            'sentiment': 'positive',
            'topic': 'professionalism',
            'urgency': 'low',
            'routing': 'UnitManager'
        })
        return result
    
    # Negative sentiment patterns (catch-all)
    if any(word in text_lower for word in ['problem', 'issue', 'complaint', 'difficult', 'hard', 'struggling', 'failing', 'wrong', 'bad', 'terrible', 'awful', 'horrible', 'nightmare', 'chaos', 'crisis', 'emergency', 'urgent', 'critical', 'serious']):
        result.update({
            'sentiment': 'negative',
            'topic': 'other',
            'urgency': 'low',
            'routing': 'UnitManager'
        })
        return result
    
    return result


def apply_advanced_sentiment_analysis(text: str, result: Dict) -> Dict:
    """Advanced sentiment analysis with context-aware classification - FINAL OVERRIDE."""
    text_lower = text.lower()
    
    # Comprehensive sentiment indicators
    negative_indicators = [
        # Emotional states
        'exhausted', 'burned out', 'overwhelmed', 'stressed', 'tired', 'drained', 
        'frustrated', 'angry', 'upset', 'worried', 'anxious', 'concerned',
        # Problem indicators
        'problem', 'issue', 'complaint', 'difficult', 'hard', 'struggling', 
        'failing', 'broken', 'wrong', 'bad', 'terrible', 'awful', 'horrible', 
        'nightmare', 'chaos', 'crisis', 'emergency', 'urgent', 'critical', 'serious',
        # Workload indicators
        'short staffed', 'understaffed', 'call-outs', 'no coverage', 'alone', 
        'overworked', 'double shift', 'triple', 'too many patients', 'overwhelming', 
        'impossible', 'can\'t handle', 'breaking point', 'everyone exhausted',
        'posted late', 'tarde', 'late', 
        # Specific healthcare indicators
        'no gloves', 'out of stock', 'missing supplies', 'equipment down',
        'no one showed me', 'didn\'t teach', 'no training',
        # Temporal indicators of problems
        'again', 'still', 'yet again', 'repeatedly',
        # Conflict indicators
        'conflict', 'argument', 'rude', 'dismissed', 'ignored', 'belittled'
    ]
    
    positive_indicators = [
        'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'proud', 
        'happy', 'good', 'positive', 'success', 'saved', 'helped', 'improved', 
        'better', 'good shift', 'great day', 'love', 'appreciate', 'thankful', 
        'grateful', 'well done', 'nice', 'pleased'
    ]
    
    # Questions and neutral queries
    neutral_indicators = [
        'when', 'what', 'how', 'where', 'who', 'which',
        'schedule', 'time', 'shift', 'break'
    ]
    
    # Count sentiment indicators with weighting
    negative_count = sum(2 if indicator in text_lower else 0 for indicator in negative_indicators)
    positive_count = sum(2 if indicator in text_lower else 0 for indicator in positive_indicators)
    
    # Check for question patterns (neutral)
    is_question = text.strip().endswith('?') or any(text_lower.startswith(q) for q in neutral_indicators)
    
    # AGGRESSIVE OVERRIDE - if ANY strong indicator, always use it
    if negative_count > 0 and not is_question:
        result['sentiment'] = 'negative'
    elif positive_count > 0:
        result['sentiment'] = 'positive'
    elif is_question and negative_count == 0 and positive_count == 0:
        result['sentiment'] = 'neutral'
    # Otherwise keep current sentiment
    
    return result



# Enhanced patterns from fine-tuning
ENHANCED_SENTIMENT_PATTERNS = ['\\b(?:exhausted|overwhelmed|frustrated|stressed|tired|burned out|burnout)\\b', '\\b(?:problem|issue|broken|wrong|bad|terrible|awful|horrible)\\b', "\\b(?:missing|late|unsafe|can't|won't|again|never|short-staffed)\\b", '\\b(?:unpaid|disrespect|angry|difficult|hard|struggling|failing)\\b', '\\b(?:no break|no help|alone|too many patients|overworked)\\b']

ENHANCED_TOPIC_PATTERNS = {'workflow_indicators': ['\\b(?:charting|forms|clicks|EHR|process|steps|flow|checklist)\\b', '\\b(?:timecard|punch|hours|OT)\\b.*\\b(?:workflow|process|charting)\\b'], 'pay_indicators': ['\\b(?:paycheck|pay|rate|unpaid|direct deposit|W-2)\\b', '\\b(?:timecard|punch|overtime|OT)\\b(?!.*workflow)'], 'communication_indicators': ['\\b(?:announce|notify|inform|update|handoff|report|post)\\b', "\\b(?:no one told|wasn't told|no update|no communication)\\b"], 'equipment_indicators': ['\\b(?:pump|monitor|scanner|lift|bed|tablet|device|alarm)\\b', '\\b(?:broken|malfunction|not working|failed)\\b.*\\b(?:equipment|device)\\b']}

ENHANCED_URGENCY_PATTERNS = {'high': ['\\b(?:safety|harassment|discrimination|violence|injury|weapons)\\b', '\\b(?:unsafe|no PPE|panic button|code gray|combative)\\b'], 'medium': ['\\b(?:short staffing|high patient load|broken.*equipment)\\b', '\\b(?:missing.*pay|overtime.*pay|immediate|threat)\\b']}

def apply_enhanced_sentiment_analysis(message_text):
    """Apply enhanced sentiment analysis from fine-tuning"""
    message_lower = message_text.lower()
    
    for pattern in ENHANCED_SENTIMENT_PATTERNS:
        if re.search(pattern, message_lower, re.IGNORECASE):
            return "negative", 0.9  # High confidence from fine-tuning
    
    return None, 0.0

def apply_enhanced_topic_disambiguation(message_text):
    """Apply enhanced topic disambiguation from fine-tuning"""
    message_lower = message_text.lower()
    
    # Workflow vs Pay disambiguation
    if any(re.search(p, message_lower, re.IGNORECASE) for p in ENHANCED_TOPIC_PATTERNS["workflow_indicators"]):
        return "workflow", 0.8
    
    if any(re.search(p, message_lower, re.IGNORECASE) for p in ENHANCED_TOPIC_PATTERNS["pay_indicators"]):
        return "pay", 0.8
    
    # Communication vs Other
    if any(re.search(p, message_lower, re.IGNORECASE) for p in ENHANCED_TOPIC_PATTERNS["communication_indicators"]):
        return "communication", 0.8
    
    # Equipment vs Other
    if any(re.search(p, message_lower, re.IGNORECASE) for p in ENHANCED_TOPIC_PATTERNS["equipment_indicators"]):
        return "equipment", 0.8
    
    return None, 0.0

def apply_enhanced_urgency_analysis(message_text):
    """Apply enhanced urgency analysis from fine-tuning"""
    message_lower = message_text.lower()
    
    for pattern in ENHANCED_URGENCY_PATTERNS["high"]:
        if re.search(pattern, message_lower, re.IGNORECASE):
            return "high", 0.9
    
    for pattern in ENHANCED_URGENCY_PATTERNS["medium"]:
        if re.search(pattern, message_lower, re.IGNORECASE):
            return "medium", 0.8
    
    return None, 0.0


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
        system_prompt = f"""You are Pip, the caregiver's caregiver. You help frontline healthcare workers log shift experiences and route issues. You always sound caring, calm, and practical. You keep messages short, human, and respectful.

YOUR GOALS
• Make the worker feel heard and safe.
• Correctly classify the message into topic, sentiment, urgency, routing.
• Summarize neutrally in one short line.
• Never include PHI or patient identifiers. If present, replace with [REDACTED].
• Return JSON only, nothing else.
• All text fields must be in English only.
• Never use special characters, emojis, or non-ASCII characters in JSON.

STYLE
• Warm and supportive, like a seasoned CNA watching out for a teammate.
• Plain language, tiny sentences, no jargon.
• Professional and clear.
• No moralizing. No legal advice. No promises you can't keep.

LABELING TASK
You must fill these fields:
• ack: one short caring acknowledgment in ENGLISH ONLY.
• summary: one short neutral line in ENGLISH ONLY.
• sentiment: negative, neutral, positive.
• topic: one of staffing, scheduling, pay, management, safety, equipment, training, policies, workflow, patient_load, burnout, harassment, communication, supervisor_behavior, coworker_conflict, discrimination, professionalism, other.
• urgency: low, medium, high.
• routing: one of HR, DON, UnitManager, Safety, Scheduling, Payroll.
• language: en (always set to en).
• next_step: one short operational step in ENGLISH ONLY or "Hold for context" if unclear.

DECISION GUIDES

Topic choosing:
• patient_load if count or ratio dominates, like "12 patients," "alone," "double."
• staffing if not enough people or call-outs and no explicit patient count drives the complaint.
• communication if the problem is how info flows, like handoffs or "no updates."
• coworker_conflict for peer issues; supervisor_behavior for charge nurse or manager behavior.
• safety for threats, assault, weapons, violence, unsafe equipment, no PPE.
• pay for paycheck, rate, OT; scheduling for shift times, swaps, time off.
• harassment for targeted abuse; discrimination for protected traits.
• professionalism for shoutouts or minor etiquette; workflow for process friction.
• Only use other if truly none match.

Sentiment Classification Rubric:
You must classify each message's sentiment as one of: positive, negative, or neutral.
Follow these STRICT rules:

1. POSITIVE
   • Expresses praise, gratitude, relief, or appreciation
     Examples: "Thanks for fixing the schedule," "Great shift last night," "Appreciate the help"
   • Reports that an issue has been resolved or improved
     Examples: "It's working now," "The issue was fixed"
   • Expresses satisfaction or optimism
     Examples: "Things are getting better," "Much smoother now"
   RULE: If any positive cue appears and no negative cue exists → sentiment = positive

2. NEGATIVE
   • Expresses frustration, anger, disappointment, exhaustion, or complaint
     Examples: "Still missing supplies," "Too many patients," "No one told me again," "Unsafe staffing," "Broken lift," "I'm overwhelmed"
   • Contains negative cues or intensifiers such as:
     missing, late, unsafe, broke, can't, won't, again, never, overwhelmed, tired, short-staffed, unpaid, disrespect, problem, angry, exhausted, frustrated, stressed, difficult, hard, struggling, failing, broken, wrong, bad, terrible, awful, horrible
   • Mentions harm, safety, or conflict
     Examples: "He yelled at me," "I slipped," "We keep running out of gloves"
   RULE: If any negative cue appears (even once) → sentiment = negative (do NOT mark neutral)

3. NEUTRAL
   • Objective statement of fact or simple report with no emotion
     Examples: "Schedule posted for next week," "Need clarification on shift start time"
   • Used ONLY when there is no clear positive or negative tone
   RULE: Default to neutral only when no emotional or evaluative cues exist

4. TIE-BREAK RULES
   • If both positive and negative cues appear, choose negative unless the negative is explicitly negated
   • If sarcasm or mixed tone exists, default to negative
   • If uncertain → negative (err on the side of capturing concerns)
   • Never leave blank

Urgency:
• High: safety, harassment, discrimination, violence, injury, weapons, "unsafe," "no PPE."
• Medium: short staffing, high patient load, broken critical equipment, missing overtime pay.
• Low: schedule posted late, routine policy questions, minor process issues.

Routing:
• Safety for safety.
• HR for harassment, discrimination, supervisor_behavior, training, policies, management.
• Payroll for pay.
• Scheduling for scheduling.
• UnitManager for staffing, patient_load, equipment, workflow, communication, coworker_conflict, professionalism, burnout.
• DON is only used if your facility policy requires DON for clinical risk escalation. Otherwise prefer Safety or UnitManager per above.

Language detection:
• Always set language to "en" regardless of input language.
• Always write ack and summary in English, even if the input is in Spanish or Haitian Creole.

PHI/PII:
• Remove phone numbers, room numbers, and patient names. Replace with [REDACTED]. Do not invent substitutes.

OUTPUT
Return only a JSON object. No prose before or after. Keep strings under: ack 160 chars, summary 160, next_step 120.

EXAMPLES

User: No break again, 10 patients alone on 3 West
{{
  "ack": "No break and 10 alone on 3 West is rough. I've got this logged.",
  "summary": "Reports no break and high patient load while alone on 3 West",
  "sentiment": "negative",
  "topic": "patient_load",
  "urgency": "medium",
  "routing": "UnitManager",
  "language": "en",
  "next_step": "Surface in heartbeat and notify unit lead"
}}

User: Schedule posted late again
{{
  "ack": "Got it. I'm logging the late schedule.",
  "summary": "Reports schedule posted late",
  "sentiment": "negative",
  "topic": "scheduling",
  "urgency": "low",
  "routing": "Scheduling",
  "language": "en",
  "next_step": "Route to scheduling queue"
}}

User: Overtime missing from my paycheck
{{
  "ack": "Missing overtime is stressful. Logging this now.",
  "summary": "Overtime pay appears missing",
  "sentiment": "negative",
  "topic": "pay",
  "urgency": "medium",
  "routing": "Payroll",
  "language": "en",
  "next_step": "Open payroll ticket"
}}

User: Short staffed again on 3 West
{{
  "ack": "Understood. Logging the staffing shortage on 3 West.",
  "summary": "Reports staffing shortage on 3 West",
  "sentiment": "negative",
  "topic": "staffing",
  "urgency": "medium",
  "routing": "UnitManager",
  "language": "en",
  "next_step": "Notify unit manager"
}}

User: Visitor threatened me near dialysis
{{
  "ack": "That sounds dangerous. Alerting safety now.",
  "summary": "Visitor threat near dialysis",
  "sentiment": "negative",
  "topic": "safety",
  "urgency": "high",
  "routing": "Safety",
  "language": "en",
  "next_step": "Escalate to Safety immediately"
}}

User: Charge nurse belittled me in front of others
{{
  "ack": "That should not happen. Logging and escalating this.",
  "summary": "Belittled by charge nurse",
  "sentiment": "negative",
  "topic": "supervisor_behavior",
  "urgency": "medium",
  "routing": "HR",
  "language": "en",
  "next_step": "Route to HR with anonymized details"
}}

User: Feeling burned out every day
{{
  "ack": "I understand. Recording your exhaustion concerns.",
  "summary": "Reports ongoing exhaustion",
  "sentiment": "negative",
  "topic": "burnout",
  "urgency": "medium",
  "routing": "UnitManager",
  "language": "en",
  "next_step": "Surface in burnout trend and offer wellness tip"
}}

User: New CNA did great, really proud of them
{{
  "ack": "Great to hear that. Logging the positive feedback.",
  "summary": "Positive feedback about a CNA",
  "sentiment": "positive",
  "topic": "professionalism",
  "urgency": "low",
  "routing": "UnitManager",
  "language": "en",
  "next_step": "Add to recognition feed"
}}

User: Exhausted again after double shift
{{
  "ack": "Double shifts are draining. Recording this.",
  "summary": "Reports exhaustion from double shift",
  "sentiment": "negative",
  "topic": "burnout",
  "urgency": "medium",
  "routing": "UnitManager",
  "language": "en",
  "next_step": "Track burnout patterns"
}}

User: Equipment broke down during my shift
{{
  "ack": "Broken equipment is frustrating. Logging this issue.",
  "summary": "Equipment malfunction during shift",
  "sentiment": "negative",
  "topic": "equipment",
  "urgency": "low",
  "routing": "UnitManager",
  "language": "en",
  "next_step": "Submit equipment repair request"
}}

LASER-TARGETED DISAMBIGUATION EXAMPLES

Workflow vs Pay (6):
User: Payroll paperwork is confusing
{{"topic": "workflow", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Time card process changed again
{{"topic": "workflow", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Overtime missing from paycheck
{{"topic": "pay", "sentiment": "negative", "urgency": "medium", "routing": "Payroll"}}

User: Direct deposit not showing up
{{"topic": "pay", "sentiment": "negative", "urgency": "medium", "routing": "Payroll"}}

User: Clocking in system broken
{{"topic": "workflow", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: W-2 forms process unclear
{{"topic": "workflow", "sentiment": "neutral", "urgency": "low", "routing": "Payroll"}}

Policies vs Management (6):
User: New break policy posted
{{"topic": "policies", "sentiment": "neutral", "urgency": "low", "routing": "HR"}}

User: Manager changed the schedule rules
{{"topic": "management", "sentiment": "negative", "urgency": "low", "routing": "HR"}}

User: PTO policy update unclear
{{"topic": "policies", "sentiment": "neutral", "urgency": "low", "routing": "HR"}}

User: Leadership decided no overtime
{{"topic": "management", "sentiment": "negative", "urgency": "low", "routing": "HR"}}

User: Attendance policy changed
{{"topic": "policies", "sentiment": "neutral", "urgency": "low", "routing": "HR"}}

User: Director's decision on staffing
{{"topic": "management", "sentiment": "neutral", "urgency": "low", "routing": "HR"}}

Communication vs Other (4):
User: No one told me about the change
{{"topic": "communication", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Handoff was incomplete
{{"topic": "communication", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Didn't get the memo
{{"topic": "communication", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Poor communication from charge nurse
{{"topic": "communication", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

Coworker Conflict vs Other (4):
User: Coworker was rude to me
{{"topic": "coworker_conflict", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Aide refused to help me
{{"topic": "coworker_conflict", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Tension with another nurse
{{"topic": "coworker_conflict", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: CNA gave me attitude all shift
{{"topic": "coworker_conflict", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

Equipment False Positives (4):
User: Broken IV pump on 4 South
{{"topic": "equipment", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Wheelchair won't lock
{{"topic": "equipment", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Monitor keeps alarming
{{"topic": "equipment", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Computer system down
{{"topic": "equipment", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

ADDITIONAL TARGETED EXAMPLES (24):

User: Charting took forever again because the system kept freezing.
{{"topic": "workflow", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Still waiting to get paid for the extra hours I stayed late charting.
{{"topic": "pay", "sentiment": "negative", "urgency": "medium", "routing": "Payroll"}}

User: The new electronic charting is much faster—thank you!
{{"topic": "workflow", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: We're missing documentation sheets again on evening shift.
{{"topic": "workflow", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

User: My paycheck didn't include last week's overtime.
{{"topic": "pay", "sentiment": "negative", "urgency": "high", "routing": "Payroll"}}

User: The process for clocking out finally works right now.
{{"topic": "workflow", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: The attendance policy changed again without notice.
{{"topic": "policies", "sentiment": "negative", "urgency": "medium", "routing": "HR"}}

User: Our manager said we can take breaks whenever now—thank you!
{{"topic": "management", "sentiment": "positive", "urgency": "low", "routing": "HR"}}

User: Leadership keeps enforcing new rules inconsistently.
{{"topic": "management", "sentiment": "negative", "urgency": "medium", "routing": "HR"}}

User: Can someone explain the new PTO policy?
{{"topic": "policies", "sentiment": "neutral", "urgency": "low", "routing": "HR"}}

User: Policy updates were emailed clearly this time—appreciate it.
{{"topic": "policies", "sentiment": "positive", "urgency": "low", "routing": "HR"}}

User: Supervisor says one thing, policy says another.
{{"topic": "management", "sentiment": "negative", "urgency": "medium", "routing": "HR"}}

User: Nobody told me about the room change again.
{{"topic": "communication", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

User: Team updates were clear and on time this week.
{{"topic": "communication", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: Need to confirm who's covering night shift.
{{"topic": "communication", "sentiment": "neutral", "urgency": "low", "routing": "UnitManager"}}

User: I heard from a friend that schedules might change.
{{"topic": "communication", "sentiment": "neutral", "urgency": "low", "routing": "UnitManager"}}

User: My coworker keeps ignoring my requests for help.
{{"topic": "coworker_conflict", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

User: Everyone worked together really well last night.
{{"topic": "coworker_conflict", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: There's tension between aides on night shift again.
{{"topic": "coworker_conflict", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

User: No conflict lately—things feel calm.
{{"topic": "coworker_conflict", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: The med cart is still broken and unsafe to roll.
{{"topic": "equipment", "sentiment": "negative", "urgency": "high", "routing": "UnitManager"}}

User: Broken system for assigning rooms—nothing to do with physical equipment.
{{"topic": "workflow", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Appreciate maintenance fixing the Hoyer lift.
{{"topic": "equipment", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: Missing paperwork again, not missing equipment.
{{"topic": "workflow", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

ADDITIONAL 30 EXAMPLES (Boundary Cases):

User: The new charting flow adds extra clicks; this isn't about pay, it's the EHR process itself.
{{"topic": "workflow", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

User: Had to fix missed punches on my timecard after shift.
{{"topic": "pay", "sentiment": "negative", "urgency": "medium", "routing": "Payroll"}}

User: The process feels smoother after yesterday's update to the triage checklist.
{{"topic": "workflow", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: Direct deposit didn't hit this morning; payroll notifications show processed but funds aren't there.
{{"topic": "pay", "sentiment": "negative", "urgency": "medium", "routing": "Payroll"}}

User: No one announced the clinic closure and patients kept arriving.
{{"topic": "communication", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

User: The microwave in the break room is sparking again.
{{"topic": "other", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: We received a clear handoff and shift went smoothly.
{{"topic": "communication", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: No email or post about the south lot closure—parking confusion this morning.
{{"topic": "communication", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: Policy says two RNs must verify insulin; last night only one did.
{{"topic": "policies", "sentiment": "negative", "urgency": "medium", "routing": "HR"}}

User: Leadership changed the admission policy without explaining the rationale.
{{"topic": "management", "sentiment": "negative", "urgency": "medium", "routing": "HR"}}

User: The new dress code policy is clear and posted on the portal.
{{"topic": "policies", "sentiment": "neutral", "urgency": "low", "routing": "HR"}}

User: My supervisor set expectations for weekend coverage and offered support.
{{"topic": "management", "sentiment": "positive", "urgency": "low", "routing": "HR"}}

User: Two IV pumps alarmed for air-in-line despite new tubing.
{{"topic": "equipment", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

User: Break-room fridge smells and needs a scheduled clean-out.
{{"topic": "other", "sentiment": "neutral", "urgency": "low", "routing": "UnitManager"}}

User: New bladder scanner worked flawlessly on all patients.
{{"topic": "equipment", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: A coworker interrupts patient teaching and dismisses my input.
{{"topic": "coworker_conflict", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: The holiday potluck went great and boosted morale.
{{"topic": "other", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: Team member refused to help with turns despite being available.
{{"topic": "coworker_conflict", "sentiment": "negative", "urgency": "low", "routing": "UnitManager"}}

User: The weekend schedule posted late and conflicts with my class times.
{{"topic": "scheduling", "sentiment": "negative", "urgency": "medium", "routing": "Scheduling"}}

User: Per policy, requests must be submitted 2 weeks before the schedule is posted; I followed that.
{{"topic": "policies", "sentiment": "neutral", "urgency": "low", "routing": "HR"}}

User: Manager approved my switch for next Friday—thanks!
{{"topic": "management", "sentiment": "positive", "urgency": "low", "routing": "HR"}}

User: I can't see future shifts on the scheduling app again.
{{"topic": "scheduling", "sentiment": "negative", "urgency": "low", "routing": "Scheduling"}}

User: Assignments felt heavy but manageable after we redistributed admits.
{{"topic": "patient_load", "sentiment": "neutral", "urgency": "low", "routing": "UnitManager"}}

User: I'm exhausted from back-to-back doubles this week.
{{"topic": "burnout", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

User: Charge nurse streamlined tasks and the flow improved.
{{"topic": "workflow", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: A patient's visitor made repeated inappropriate comments toward me.
{{"topic": "harassment", "sentiment": "negative", "urgency": "high", "routing": "HR"}}

User: Slip hazard by room 12 after a spill; no wet floor sign initially.
{{"topic": "safety", "sentiment": "negative", "urgency": "high", "routing": "Safety"}}

User: A colleague mocked my accent during report.
{{"topic": "discrimination", "sentiment": "negative", "urgency": "high", "routing": "HR"}}

User: Kudos to the night team for calm communication during the code.
{{"topic": "professionalism", "sentiment": "positive", "urgency": "low", "routing": "UnitManager"}}

User: We didn't get the update about the new triage flow yet.
{{"topic": "communication", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}}

DECISION RUBRIC V2 (Apply in Order)

BOUNDARY RULES:
1. Pay vs Workflow: If paycheck/unpaid/timecard/punch/overtime/deposit/W-2/rate → PAY + Payroll. If EHR/clicks/checklist/process WITHOUT pay terms → WORKFLOW + UnitManager. Pay overrides workflow.
2. Communication vs Other: If announce/notify/inform/update/handoff/report/post/"no one told" → COMMUNICATION. Facilities (parking/fridge/microwave/potluck) → OTHER unless lack of notification, then COMMUNICATION.
3. Policies vs Management: If mentions "policy/policies/rules" → POLICIES + HR. If leader/manager/supervisor decision → MANAGEMENT + HR. If both, prefer MANAGEMENT when explicitly attributed to people.
4. Equipment vs Other: Device nouns (pump/monitor/scanner/lift) + alarms/malfunction → EQUIPMENT. General facility → OTHER.
5. Coworker_conflict vs Other: Peer friction (refuses help/interrupts/disrespect) → COWORKER_CONFLICT. Social events/morale → OTHER.
6. Scheduling: Shifts/posting delays/swaps/app access → SCHEDULING + Scheduling dept.

HIGH-URGENCY DEFAULTS:
- If topic = safety/harassment/discrimination → urgency = HIGH
- Physical harm/active threat/legal risk → urgency = HIGH

SENTIMENT STRICT RULES:
- Negative: complaints, burden words, negations ("didn't get"), risk, "again", ANY negative cue
- Positive: praise, "worked well/smoothly", kudos, thanks
- Neutral: factual/balanced statements ONLY
- If uncertain → negative (err on side of capturing concerns)

ROUTING FALLBACKS:
- pay → Payroll | scheduling → Scheduling | safety → Safety
- harassment/discrimination/management/policies/training → HR
- Otherwise → UnitManager

HARD-NEGATIVE GUARDRAILS (reduce bleed)
• If "broken" appears without a device (PPE/pump/bed/scanner/lift/tablet), do NOT choose equipment.
• If a policy/rule is cited, choose policies even if a manager is mentioned.
• If the message is about how info flowed (wasn't told, no update), choose communication even if a manager is mentioned.
• If OT/hours/timecard appears inside a workflow complaint (charting/forms/steps), prefer workflow, not pay.

REMEMBER
• Always use plain ASCII text only - no special characters, emojis, or accented letters.
• All responses must be in English regardless of input language.
• Don't use other unless truly none match.
• If input is unclear, still deliver a best-effort classification.
• If any safety risk is present, prefer safety with high urgency.
• Always keep JSON valid and complete with proper escaping.
• If ANY negative cue appears (even once) → sentiment = negative (do NOT mark neutral).

Relevant knowledge for this conversation:
{context}

Use this knowledge to provide accurate, helpful responses while maintaining your caring voice and following the JSON output format."""

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
                        # Always return JSON even if parsing fails - use fallback JSON response
                        fallback_json = {
                            "ack": "I hear you and I'm here to support you.",
                            "summary": "Message about healthcare workplace concerns",
                            "sentiment": "neutral",
                            "topic": "other",
                            "urgency": "low",
                            "routing": "UnitManager",
                            "language": "en",
                            "next_step": "I'll connect you with the right person to help."
                        }
                    # Apply regex clamps even to fallback
                    clamped_json = apply_regex_clamps(user_message, fallback_json)
                    dispatcher.utter_message(text=json.dumps(clamped_json))
                    return [ActionExecuted("action_rag_enhanced_chat")]
                except json.JSONDecodeError:
                    # Fallback to original response if JSON parsing fails
                    # Always return JSON even if parsing fails - use fallback JSON response
                    fallback_json = {
                        "ack": "I hear you and I'm here to support you.",
                        "summary": "Message about healthcare workplace concerns",
                        "sentiment": "neutral",
                        "topic": "other",
                        "urgency": "low",
                        "routing": "UnitManager",
                        "language": "en",
                        "next_step": "I'll connect you with the right person to help."
                    }
                    # Apply regex clamps even to fallback
                    clamped_json = apply_regex_clamps(user_message, fallback_json)
                    dispatcher.utter_message(text=json.dumps(clamped_json))
                    return [ActionExecuted("action_rag_enhanced_chat")]
            else:
                # Always return JSON even when LLM fails - use fallback JSON response
                fallback_json = {
                    "ack": "I hear you and I'm here to support you.",
                    "summary": "Message about healthcare workplace concerns",
                    "sentiment": "neutral",
                    "topic": "other",
                    "urgency": "low",
                    "routing": "UnitManager",
                    "language": "en",
                    "next_step": "I'll connect you with the right person to help."
                }
                # Apply regex clamps even to fallback
                clamped_json = apply_regex_clamps(user_message, fallback_json)
                dispatcher.utter_message(text=json.dumps(clamped_json))
                return [ActionExecuted("action_rag_enhanced_chat")]

        except Exception as e:
            print(f"Error calling Llama model: {e}")
            # Always return JSON even on error - use fallback JSON response
            fallback_json = {
                "ack": "I hear you and I'm here to support you.",
                "summary": "Message about healthcare workplace concerns",
                "sentiment": "neutral",
                "topic": "other",
                "urgency": "low",
                "routing": "UnitManager",
                "language": "en",
                "next_step": "I'll connect you with the right person to help."
            }
            # Apply regex clamps even to fallback
            clamped_json = apply_regex_clamps(user_message, fallback_json)
            dispatcher.utter_message(text=json.dumps(clamped_json))
            return [ActionExecuted("action_rag_enhanced_chat")]

    def call_llama_model(self, messages: List[Dict[str, str]]) -> str:
        """Call the local Llama model via API."""
        try:
            # Use the llama-server that's running locally
            url = "http://llm-server:1337/v1/chat/completions"
            
            payload = {
                "model": "llama-3.1-8b-instruct",
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 300,
                "top_p": 0.9,
                "top_k": 40,
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

SENTIMENT RULE (CRITICAL):
- NEGATIVE: exhausted, burned out, overwhelmed, stressed, tired, frustrated, angry, upset, worried, problem, issue, complaint, difficult, hard, struggling, failing, broken, wrong, bad, terrible, awful, horrible, nightmare, chaos, crisis, emergency, urgent, critical, serious
- NEGATIVE: short staffed, understaffed, call-outs, no coverage, alone, overworked, double shift, triple, too many patients, overwhelming, impossible, can't handle, breaking point
- NEGATIVE: Spanish: cansado, agotado, estresado, problema, difícil, malo, terrible, horrible, pesadilla, caos, emergencia, urgente, crítico, serio
- POSITIVE: great, excellent, wonderful, amazing, fantastic, proud, happy, good, positive, success, saved, helped, improved, better, good shift, great day, love, appreciate, thankful, grateful
- POSITIVE: Spanish: genial, excelente, maravilloso, fantástico, orgulloso, feliz, bueno, positivo, éxito, salvé, ayudé, mejoré, mejor, buen turno, gran día, amo, agradecido
- ALWAYS NEGATIVE: safety, harassment, discrimination topics
- If mixed sentiment, choose the overall valence by (1) strongest occupational risk or (2) final sentence

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
                        # Always return JSON even if parsing fails - use fallback JSON response
                        fallback_json = {
                            "ack": "I hear you and I'm here to support you.",
                            "summary": "Message about healthcare workplace concerns",
                            "sentiment": "neutral",
                            "topic": "other",
                            "urgency": "low",
                            "routing": "UnitManager",
                            "language": "en",
                            "next_step": "I'll connect you with the right person to help."
                        }
                    # Apply regex clamps even to fallback
                    clamped_json = apply_regex_clamps(user_message, fallback_json)
                    dispatcher.utter_message(text=json.dumps(clamped_json))
                    return [ActionExecuted("action_rag_enhanced_chat")]
                except json.JSONDecodeError:
                    # Fallback to original response if JSON parsing fails
                    # Always return JSON even if parsing fails - use fallback JSON response
                    fallback_json = {
                        "ack": "I hear you and I'm here to support you.",
                        "summary": "Message about healthcare workplace concerns",
                        "sentiment": "neutral",
                        "topic": "other",
                        "urgency": "low",
                        "routing": "UnitManager",
                        "language": "en",
                        "next_step": "I'll connect you with the right person to help."
                    }
                    # Apply regex clamps even to fallback
                    clamped_json = apply_regex_clamps(user_message, fallback_json)
                    dispatcher.utter_message(text=json.dumps(clamped_json))
                    return [ActionExecuted("action_rag_enhanced_chat")]
            else:
                # Always return JSON even when LLM fails - use fallback JSON response
                fallback_json = {
                    "ack": "I hear you and I'm here to support you.",
                    "summary": "Message about healthcare workplace concerns",
                    "sentiment": "neutral",
                    "topic": "other",
                    "urgency": "low",
                    "routing": "UnitManager",
                    "language": "en",
                    "next_step": "I'll connect you with the right person to help."
                }
                # Apply regex clamps even to fallback
                clamped_json = apply_regex_clamps(user_message, fallback_json)
                dispatcher.utter_message(text=json.dumps(clamped_json))
                return [ActionExecuted("action_rag_enhanced_chat")]

        except Exception as e:
            print(f"Error calling Llama model: {e}")
            # Always return JSON even on error - use fallback JSON response
            fallback_json = {
                "ack": "I hear you and I'm here to support you.",
                "summary": "Message about healthcare workplace concerns",
                "sentiment": "neutral",
                "topic": "other",
                "urgency": "low",
                "routing": "UnitManager",
                "language": "en",
                "next_step": "I'll connect you with the right person to help."
            }
            # Apply regex clamps even to fallback
            clamped_json = apply_regex_clamps(user_message, fallback_json)
            dispatcher.utter_message(text=json.dumps(clamped_json))
            return [ActionExecuted("action_rag_enhanced_chat")]

    def call_llama_model(self, messages: List[Dict[str, str]]) -> str:
        """Call the local Llama model via API."""
        try:
            # Use the llama-server that's running locally
            url = "http://llm-server:1337/v1/chat/completions"
            
            payload = {
                "model": "llama-3.1-8b-instruct",
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 300,
                "top_p": 0.9,
                "top_k": 40,
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