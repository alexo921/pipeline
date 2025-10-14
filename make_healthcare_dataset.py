#!/usr/bin/env python3
# save as make_healthcare_dataset.py and run:  python make_healthcare_dataset.py
import json, random, pandas as pd
from collections import defaultdict
random.seed(7)
topics = [
    "staffing","scheduling","pay","management","safety","equipment","training",
    "policies","workflow","patient_load","burnout","harassment","communication",
    "supervisor_behavior","coworker_conflict","discrimination","professionalism","other",
]
default_routing = {
    "staffing":"UnitManager","scheduling":"Scheduling","pay":"Payroll","management":"HR","safety":"Safety",
    "equipment":"UnitManager","training":"HR","policies":"HR","workflow":"UnitManager","patient_load":"UnitManager",
    "burnout":"UnitManager","harassment":"HR","communication":"UnitManager","supervisor_behavior":"HR",
    "coworker_conflict":"UnitManager","discrimination":"HR","professionalism":"UnitManager","other":"UnitManager",
}
sentiment_terms_pos = ["thank you","appreciate","pleased","resolved","went smoothly","great support","kudos","works well","much better","improved"]
sentiment_terms_neg = ["again","late","missing","can't","won't","unsafe","broke","broken","didn't work","unpaid","issue","problem","frustrated","annoyed","angry","worried","concerned","urgent"]
banks = defaultdict(list)
banks.update({
"staffing":[
"We were short two CNAs on nights and I had to cover extra rooms.",
"Charge nurse floated again due to lack of coverage.",
"Overtime requests keep coming because the roster is thin.",
"New hires keep dropping; staffing remains tight on weekends.",
],
"scheduling":[
"My shift was moved without notice on the schedule.",
"I can't swap my Friday even though policy says I can request.",
"The posted schedule doesn't match the app.",
"I was put on back-to-back nights and days unexpectedly.",
],
"pay":[
"My paycheck is missing my weekend differential.",
"Direct deposit didn't hit this morning.",
"My W-2 has an error with my address.",
"Overtime rate looks incorrect on this pay period.",
],
"management":[
"Leadership keeps changing the rollout with no explanation.",
"The director canceled our huddle without telling the unit.",
"Management announced changes during lunch with no Q&A.",
"Leadership wants us to double chart temporarily.",
],
"safety":[
"Panic button didn't work during an incident with a combative visitor.",
"Sharps were left unattended in the triage bay.",
"Oxygen alarm failed and no one was alerted.",
"We called a code gray; security took too long to arrive.",
],
"equipment":[
"The IV pump failed calibration mid-infusion.",
"The lift is out of service again and the sign-in sheet is full.",
"One glucometer keeps throwing an error code 3.",
"The portable monitor battery won't hold a charge.",
],
"training":[
"I'd like more training on the new wound vac device.",
"The LMS module on sepsis screening was actually helpful—thank you.",
"We need refreshers for contrast allergy protocols.",
"Could we get hands-on time with the new EHR features?",
],
"policies":[
"The PPE reuse rule changed but we haven't seen the updated policy.",
"Per policy, we're supposed to double-check insulin with a second nurse.",
"New float policy says we can refuse unsafe assignments.",
"Visitation rules were updated; please provide the latest version.",
],
"workflow":[
"The charting steps doubled after the update; forms feel redundant.",
"The discharge checklist is too long and duplicates the summary.",
"New barcode step adds clicks without improving safety.",
"The handoff template is missing fields we actually use.",
],
"patient_load":[
"I had 7 patients on days including two total cares.",
"Assignments are uneven; my side had all new admissions.",
"Census is up and we don't have float support.",
"My pod keeps getting high acuity without help.",
],
"burnout":[
"I'm exhausted and dreading coming in again.",
"I can't keep skipping breaks—this is burning me out.",
"Morale is low; people are talking about leaving.",
"I'm overwhelmed even after the shift ends.",
],
"harassment":[
"A visitor made repeated inappropriate comments to me.",
"I was harassed by a coworker in the break room.",
"A patient's family member keeps sending threatening messages.",
"Someone spread rumors and made me feel unsafe at work.",
],
"communication":[
"Nobody told us the clinic was closing early.",
"We didn't get the update about the new triage flow.",
"The shift report missed critical details again.",
"No one replied on the group thread about supplies.",
],
"supervisor_behavior":[
"My supervisor dismissed my concerns in front of the team.",
"Charge nurse raised their voice at me during rounds.",
"Supervisor plays favorites on shift assignments.",
"My supervisor ignored the incident report I filed.",
],
"coworker_conflict":[
"A coworker keeps taking my assigned patients without asking.",
"There was an argument in the med room that disrupted care.",
"A colleague undermines me in front of patients.",
"We can't agree on who handles admissions.",
],
"discrimination":[
"I was passed over for an assignment due to my accent.",
"Comments were made about my background that felt discriminatory.",
"I'm being treated differently because of my religion.",
"I believe I received fewer training opportunities due to bias.",
],
"professionalism":[
"Team handled a tough code with excellent professionalism—kudos.",
"Rounds were efficient and respectful today.",
"The float nurse showed great teamwork and communication.",
"Appreciate the calm leadership during the downtime.",
],
"other":[
"The vending machines keep eating our money.",
"Parking is chaotic during shift change.",
"Break room microwave is broken again.",
"My badge reader works only on the second try.",
],
})
# Boundary emphasis pairs (to reduce model confusion)
workflow_pay_pairs = [
("The charting took forever after the update.","workflow","negative"),
("The charting took forever and I had to stay 30 minutes unpaid.","pay","negative"),
("Barcode scanning adds steps to med pass.","workflow","negative"),
("Barcode scanning added steps and I wasn't paid for staying late.","pay","negative"),
("The timecard tool is confusing to submit approvals.","workflow","negative"),
("My timecard shows the wrong overtime rate.","pay","negative"),
]
policies_mgmt_pairs = [
("The float rule says we can refuse unsafe assignments.","policies","neutral"),
("Management told us to float without addressing safety concerns.","management","negative"),
("Policy requires a double-check for insulin dosing.","policies","neutral"),
("Leadership changed practice without updating the written policy.","management","negative"),
]
policies_sched_pairs = [
("New on-call policy describes how weekends are assigned.","policies","neutral"),
("The weekend schedule was posted late and conflicts with my availability.","scheduling","negative"),
]
communication_other_pairs = [
("No one informed us about the clinic closure.","communication","negative"),
("The clinic was quiet today and nothing unusual happened.","other","neutral"),
]
coworker_other_pairs = [
("A coworker keeps interrupting my patient education sessions.","coworker_conflict","negative"),
("Break room fridge needs cleaning again.","other","neutral"),
]
equipment_guard_pairs = [
("Things felt broken in our process today but no device failed.","workflow","negative"),
("The IV pump was broken mid-infusion and alarmed repeatedly.","equipment","negative"),
]
boundary_pairs = workflow_pay_pairs + policies_mgmt_pairs + policies_sched_pairs + communication_other_pairs + coworker_other_pairs + equipment_guard_pairs
def choose_sentiment(base):
    roll = random.random()
    if base=="positive":  return "positive" if roll>0.15 else "neutral"
    if base=="negative":  return "negative" if roll>0.10 else "neutral"
    return "positive" if roll<0.2 else ("neutral" if roll<0.8 else "negative")
def choose_urgency(topic, sentiment):
    if topic in {"safety","harassment","discrimination"}: return "high"
    if topic in {"scheduling","pay","management","patient_load","supervisor_behavior","coworker_conflict"}:
        return "medium" if sentiment!="positive" else "low"
    if topic in {"workflow","equipment","policies","communication"}:
        return "medium" if sentiment=="negative" else "low"
    if topic in {"burnout"}:
        return "medium" if sentiment!="positive" else "low"
    return "low"
def make_text(topic, sentiment):
    t = random.choice(banks[topic])
    if sentiment=="positive" and random.random()<0.8:
        t += " " + random.choice(sentiment_terms_pos)
    elif sentiment=="negative" and random.random()<0.8:
        t += " " + random.choice(sentiment_terms_neg)
    return t
rows=[]; id_counter=1; per_topic=90  # 90 x 18 = 1620 base
for topic in topics:
    for _ in range(per_topic):
        base = "positive" if topic in {"professionalism","training"} else \
               ("negative" if topic in {"safety","harassment","discrimination","equipment","workflow","patient_load","burnout"} else \
                random.choice(["negative","neutral","positive"]))
        sentiment = choose_sentiment(base)
        text = make_text(topic, sentiment)
        urgency = choose_urgency(topic, sentiment)
        routing = default_routing[topic]
        lower = text.lower()
        if any(k in lower for k in ["payroll","paycheck","w-2","w2","direct deposit"]): routing="Payroll"
        rows.append({"id":id_counter,"text":text,"topic":topic,"sentiment":sentiment,"urgency":urgency,"routing":routing})
        id_counter+=1
def slight_variant(s):
    v=[s,s.replace("clinic","outpatient clinic"),s.replace("update","latest update"),
       s.replace("schedule","roster"),s.replace("policy","written policy"),
       s.replace("charting","documentation"),s.replace("Barcode","Bar-code"),
       s.replace("barcode","bar-code"),s.replace("IV pump","infusion pump")]
    return random.choice(v)
for (text, topic, sent) in boundary_pairs*5:  # 6 pairs * 5 repeats * 2 lines each ≈ +60
    sentiment = choose_sentiment(sent)
    t = slight_variant(text)
    urgency = choose_urgency(topic, sentiment)
    routing = default_routing[topic]
    lower = t.lower()
    if any(k in lower for k in ["payroll","paycheck","w-2","w2","direct deposit"]): routing="Payroll"
    if topic=="pay" and "unpaid" in lower: routing="Payroll"
    rows.append({"id":id_counter,"text":t,"topic":topic,"sentiment":sentiment,"urgency":urgency,"routing":routing})
    id_counter+=1
random.shuffle(rows)
df = pd.DataFrame(rows)
df.to_csv("healthcare_classification_dataset.csv", index=False)
with open("healthcare_classification_dataset.jsonl","w",encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False)+"\n")
print("✅ Dataset Generation Complete!")
print("=" * 50)
print(f"Total rows: {len(rows)}")
print(f"\nFiles created:")
print("  • healthcare_classification_dataset.jsonl")
print("  • healthcare_classification_dataset.csv")
print(f"\nPer-topic distribution:")
for topic, count in sorted(df['topic'].value_counts().items()):
    print(f"  {topic}: {count}")
print(f"\nSentiment distribution:")
for sent, count in sorted(df['sentiment'].value_counts().items()):
    print(f"  {sent}: {count}")
print(f"\nUrgency distribution:")
for urg, count in sorted(df['urgency'].value_counts().items()):
    print(f"  {urg}: {count}")
print(f"\nRouting distribution:")
for route, count in sorted(df['routing'].value_counts().items()):
    print(f"  {route}: {count}")
print("\n🎯 Ready for LoRA fine-tuning!")

