"""
Azure AI Language — Sentiment / Emotion Analysis

Requires environment variables:
  AZURE_LANGUAGE_KEY      — Azure Language resource key
  AZURE_LANGUAGE_ENDPOINT — e.g. "https://YOUR_RESOURCE.cognitiveservices.azure.com/"

When credentials are not set, analyze_emotion returns a neutral stub so the
pipeline continues without the sentiment service.
"""

import os
from dotenv import load_dotenv

load_dotenv()

_KEY = os.getenv("AZURE_LANGUAGE_KEY")
_ENDPOINT = os.getenv("AZURE_LANGUAGE_ENDPOINT")
_AVAILABLE = bool(_KEY and _ENDPOINT)

if _AVAILABLE:
    from azure.ai.textanalytics import TextAnalyticsClient
    from azure.core.credentials import AzureKeyCredential

# Maps Azure sentiment labels to our internal emotional states
_SENTIMENT_MAP = {
    "positive": "engaged",
    "neutral":  "curious",
    "negative": "frustrated",
    "mixed":    "confused",
}


async def analyze_emotion(text: str) -> dict:
    """
    Analyse the sentiment of a student response text.

    Args:
        text: The student's response text.

    Returns:
        {
            "sentiment":   str,   # "positive" | "negative" | "neutral" | "mixed"
            "confidence":  float, # 0.0–1.0
            "mapped_state": str,  # our internal EmotionalState value
        }
    """
    if not text or not text.strip() or not _AVAILABLE:
        return {"sentiment": "neutral", "confidence": 1.0, "mapped_state": "curious"}

    client = TextAnalyticsClient(
        endpoint=_ENDPOINT,
        credential=AzureKeyCredential(_KEY),
    )

    response = client.analyze_sentiment([text])[0]

    if response.is_error:
        return {"sentiment": "neutral", "confidence": 1.0, "mapped_state": "curious"}

    sentiment = response.sentiment
    confidence = getattr(response.confidence_scores, sentiment, 0.5)
    mapped_state = _SENTIMENT_MAP.get(sentiment, "curious")

    return {
        "sentiment": sentiment,
        "confidence": round(confidence, 4),
        "mapped_state": mapped_state,
    }
