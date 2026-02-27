"""
Azure Speech Service — STT + TTS

Requires environment variables:
  AZURE_SPEECH_KEY    — Azure Speech resource key
  AZURE_SPEECH_REGION — e.g. "eastus"

STT priority:
  1. Azure STT  — used when AZURE_SPEECH_KEY is set (expects PCM/WAV bytes)
  2. faster-whisper — local fallback; handles WebM/Opus from browser MediaRecorder

TTS returns None when unavailable — frontend silently skips audio playback.
"""

import os
import asyncio
import base64
from dotenv import load_dotenv

load_dotenv()

_KEY = os.getenv("AZURE_SPEECH_KEY")
_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")
_AVAILABLE = bool(_KEY)

if _AVAILABLE:
    import azure.cognitiveservices.speech as speechsdk

# Lazy-loaded faster-whisper model (downloaded once, cached in ~/.cache/huggingface)
_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            print("[STT] Loading faster-whisper 'tiny' model (first-time download may take ~30s)…")
            _whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
            print("[STT] faster-whisper ready.")
        except Exception as e:
            print(f"[STT] Could not load faster-whisper: {e}")
    return _whisper_model


async def _whisper_stt(audio_data: bytes) -> str:
    """Transcribe WebM/Opus audio bytes using local faster-whisper."""
    import tempfile
    import os as _os

    model = _get_whisper_model()
    if not model:
        return ""

    loop = asyncio.get_event_loop()

    def _run() -> str:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_data)
            tmp_path = f.name
        try:
            segments, _ = model.transcribe(tmp_path, language="en")
            return " ".join(s.text for s in segments).strip()
        finally:
            _os.unlink(tmp_path)

    return await loop.run_in_executor(None, _run)


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

    loop = asyncio.get_running_loop()

    def _synthesize() -> str | None:
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

    return await loop.run_in_executor(None, _synthesize)


async def speech_to_text(audio_data: bytes) -> str:
    """
    Transcribe audio bytes to text.

    Tries Azure STT first if credentials are configured (expects PCM/WAV).
    Falls back to local faster-whisper which handles WebM/Opus from the
    browser's MediaRecorder directly.

    Args:
        audio_data: Raw audio bytes from the client.

    Returns:
        Transcribed text string, or empty string if transcription fails.
    """
    if not audio_data:
        return ""

    # --- Azure STT (works with PCM/WAV; skip gracefully on format mismatch) ---
    if _AVAILABLE:
        try:
            speech_config = speechsdk.SpeechConfig(subscription=_KEY, region=_REGION)
            audio_stream = speechsdk.audio.PushAudioInputStream()
            audio_config = speechsdk.audio.AudioConfig(stream=audio_stream)
            recogniser = speechsdk.SpeechRecognizer(
                speech_config=speech_config, audio_config=audio_config
            )
            audio_stream.write(audio_data)
            audio_stream.close()
            result = recogniser.recognize_once_async().get()
            if result.reason == speechsdk.ResultReason.RecognizedSpeech and result.text:
                return result.text
        except Exception as e:
            print(f"[STT] Azure STT error, falling back to whisper: {e}")

    # --- faster-whisper fallback (handles WebM/Opus natively) ---
    return await _whisper_stt(audio_data)
