"""
Azure Speech Service — STT + TTS

Requires environment variables:
  AZURE_SPEECH_KEY    — Azure Speech resource key
  AZURE_SPEECH_REGION — e.g. "eastus"

When credentials are not set, functions return graceful stubs so the rest
of the pipeline continues to work without speech services.
"""

import os
import base64
from dotenv import load_dotenv

load_dotenv()

_KEY = os.getenv("AZURE_SPEECH_KEY")
_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")
_AVAILABLE = bool(_KEY)

if _AVAILABLE:
    import azure.cognitiveservices.speech as speechsdk


async def text_to_speech(text: str, voice_id: str) -> str | None:
    """
    Convert text to speech using Azure TTS.

    Args:
        text:     The text to synthesise.
        voice_id: Azure Neural voice name, e.g. "en-US-AriaNeural".

    Returns:
        Base64-encoded MP3 audio string, or None if unavailable / empty text.
    """
    if not text or not text.strip():
        return None

    if not _AVAILABLE:
        return None  # Frontend skips audio playback when audio_base64 is null

    speech_config = speechsdk.SpeechConfig(subscription=_KEY, region=_REGION)
    speech_config.speech_synthesis_voice_name = voice_id
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
    )

    synthesiser = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None
    )
    result = synthesiser.speak_text_async(text).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        return base64.b64encode(result.audio_data).decode("utf-8")

    return None


async def speech_to_text(audio_data: bytes) -> str:
    """
    Transcribe audio bytes to text using Azure STT.

    Args:
        audio_data: Raw PCM/WAV audio bytes from the client.

    Returns:
        Transcribed text string, or empty string if unavailable.
    """
    if not _AVAILABLE:
        return ""

    import io
    speech_config = speechsdk.SpeechConfig(subscription=_KEY, region=_REGION)
    audio_stream = speechsdk.audio.PushAudioInputStream()
    audio_config = speechsdk.audio.AudioConfig(stream=audio_stream)

    recogniser = speechsdk.SpeechRecognizer(
        speech_config=speech_config, audio_config=audio_config
    )

    audio_stream.write(audio_data)
    audio_stream.close()

    result = recogniser.recognize_once_async().get()

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text

    return ""
