export const previews = {
  "case": {
    "eyebrow": "DEMO CASE / 001",
    "title": "A case starts with context.",
    "description": "Keep supplied history and screening findings together, with room for what is still unknown.",
    "rows": [
      {
        "label": "Case history",
        "value": "Synthetic example"
      },
      {
        "label": "Fundus photograph",
        "value": "Awaiting upload"
      },
      {
        "label": "Screening result",
        "value": "Not run"
      }
    ],
    "messages": [],
    "note": "The image and its screening result stay connected to the conversation."
  },
  "conversation": {
    "eyebrow": "ILLUSTRATIVE CONVERSATION",
    "title": "A question makes room for context.",
    "description": "A sample exchange showing how missing information can be made visible.",
    "rows": [],
    "messages": [
      {
        "role": "user",
        "text": "What information is still missing from this case?"
      },
      {
        "role": "assistant",
        "text": "There is no screening result attached yet. Add a fundus photograph and run screening before we discuss its findings."
      }
    ],
    "note": "Planned: Gemma uses available case facts and asks for missing information."
  },
  "summary": {
    "eyebrow": "ILLUSTRATIVE HANDOFF",
    "title": "A clear draft. A human review.",
    "description": "A planned summary brings case facts, actual screening results, and supporting sources together.",
    "rows": [
      {
        "label": "Summary status",
        "value": "Example draft"
      },
      {
        "label": "Supporting evidence",
        "value": "Not retrieved"
      },
      {
        "label": "Specialist review",
        "value": "Pending"
      }
    ],
    "messages": [],
    "note": "No clinical findings or source citations are generated in this preview."
  }
};
