"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ICE_SERVERS,
  PRESENCE_HEARTBEAT_INTERVAL_MS,
  SIGNAL_POLL_INTERVAL_MS,
} from "@/lib/config";

export type ConnectionStatus =
  | "idle"
  | "requesting-permissions"
  | "connecting"
  | "connected"
  | "unstable"
  | "reconnecting"
  | "failed";

export type OpponentStatus = "connecting" | "connected" | "disconnected" | "left";

interface UseWebRTCParams {
  matchId: string;
  opponentUserId: string;
  /** Deterministic: the player listed first on the match creates the offer. */
  isOfferer: boolean;
  /** Video only runs while true — set false to tear the call down. */
  active: boolean;
}

interface UseWebRTCResult {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  cameraOn: boolean;
  micOn: boolean;
  cameraDenied: boolean;
  micDenied: boolean;
  connectionStatus: ConnectionStatus;
  opponentStatus: OpponentStatus;
  toggleCamera: () => void;
  toggleMic: () => void;
}

interface SignalMessage {
  type: "offer" | "answer" | "ice-candidate" | "leave";
  payload: unknown;
}

/**
 * Real peer-to-peer WebRTC audio/video for a ranked match. Signaling (SDP
 * offer/answer + ICE candidates) travels over HTTP polling against
 * /api/play/match/[matchId]/signal — the media itself never touches the
 * server. See MAX_VIDEO_CONNECT_WAIT_SECONDS in config.ts for why this
 * never blocks the underlying 30s match.
 */
export function useWebRTC({
  matchId,
  opponentUserId,
  isOfferer,
  active,
}: UseWebRTCParams): UseWebRTCResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [opponentStatus, setOpponentStatus] = useState<OpponentStatus>("connecting");

  const localStreamRef = useRef<MediaStream | null>(null);

  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => {
      if (cameraDenied) return prev;
      const next = !prev;
      localStreamRef.current?.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
      return next;
    });
  }, [cameraDenied]);

  const toggleMic = useCallback(() => {
    setMicOn((prev) => {
      if (micDenied) return prev;
      const next = !prev;
      localStreamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
      return next;
    });
  }, [micDenied]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let pc: RTCPeerConnection | null = null;
    let signalPollId: ReturnType<typeof setInterval> | undefined;
    let heartbeatId: ReturnType<typeof setInterval> | undefined;
    let presencePollId: ReturnType<typeof setInterval> | undefined;
    let lastSeq = 0;
    let remoteDescriptionSet = false;
    const pendingCandidates: RTCIceCandidateInit[] = [];
    let hasLeft = false;

    async function postSignal(type: SignalMessage["type"], payload: unknown) {
      try {
        await fetch(`/api/play/match/${matchId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, payload }),
        });
      } catch {
        // best-effort — a dropped signal is recovered by the next poll/renegotiation
      }
    }

    async function setup() {
      setConnectionStatus("requesting-permissions");

      let stream: MediaStream | null = null;
      let camDenied = false;
      let micDeniedLocal = false;

      // Staged fallback: try both, then video-only, then audio-only, then
      // proceed with neither — a denied camera/mic must never block the match.
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          camDenied = true;
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "user" },
              audio: false,
            });
            micDeniedLocal = true;
          } catch {
            camDenied = true;
            micDeniedLocal = true;
          }
        }
      }

      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      setCameraDenied(camDenied);
      setMicDenied(micDeniedLocal);
      setCameraOn(!camDenied);
      setMicOn(!micDeniedLocal);
      setLocalStream(stream);
      localStreamRef.current = stream;

      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      stream?.getTracks().forEach((track) => {
        if (stream) pc!.addTrack(track, stream);
      });

      const remote = new MediaStream();
      setRemoteStream(remote);

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          if (!remote.getTracks().includes(track)) remote.addTrack(track);
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) void postSignal("ice-candidate", event.candidate.toJSON());
      };

      async function attemptReconnect() {
        if (!pc) return;
        try {
          if (isOfferer) {
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);
            void postSignal("offer", offer);
          } else {
            pc.restartIce();
          }
        } catch {
          // will retry on the next failure
        }
      }

      pc.onconnectionstatechange = () => {
        if (cancelled || !pc) return;
        const state = pc.connectionState;
        if (state === "connected") setConnectionStatus("connected");
        else if (state === "connecting" || state === "new") setConnectionStatus("connecting");
        else if (state === "disconnected") setConnectionStatus("unstable");
        else if (state === "failed") {
          setConnectionStatus("reconnecting");
          void attemptReconnect();
        }
      };

      setConnectionStatus("connecting");

      if (isOfferer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        void postSignal("offer", offer);
      }

      async function flushPendingCandidates() {
        if (!pc) return;
        const queued = pendingCandidates.splice(0, pendingCandidates.length);
        for (const candidate of queued) {
          try {
            await pc.addIceCandidate(candidate);
          } catch {
            // stale/malformed candidate — safe to ignore
          }
        }
      }

      async function handleSignal(message: SignalMessage) {
        if (!pc) return;
        if (message.type === "offer") {
          await pc.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
          remoteDescriptionSet = true;
          await flushPendingCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          void postSignal("answer", answer);
        } else if (message.type === "answer") {
          if (pc.signalingState !== "stable") {
            await pc.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
            remoteDescriptionSet = true;
            await flushPendingCandidates();
          }
        } else if (message.type === "ice-candidate") {
          const candidate = message.payload as RTCIceCandidateInit;
          if (remoteDescriptionSet) {
            try {
              await pc.addIceCandidate(candidate);
            } catch {
              // ignore
            }
          } else {
            pendingCandidates.push(candidate);
          }
        } else if (message.type === "leave") {
          hasLeft = true;
          setOpponentStatus("left");
        }
      }

      async function pollSignals() {
        try {
          const res = await fetch(`/api/play/match/${matchId}/signal?since=${lastSeq}`);
          if (!res.ok || cancelled) return;
          const data = await res.json();
          for (const message of (data.messages ?? []) as (SignalMessage & { seq: number })[]) {
            lastSeq = Math.max(lastSeq, message.seq);
            await handleSignal(message);
          }
        } catch {
          // transient network hiccup — next poll retries
        }
      }

      async function sendHeartbeat() {
        try {
          await fetch(`/api/play/match/${matchId}/presence`, { method: "POST" });
        } catch {
          // ignore
        }
      }

      async function pollPresence() {
        try {
          const res = await fetch(`/api/play/match/${matchId}/presence`);
          if (!res.ok || cancelled) return;
          const data = await res.json();
          const entry = (data.players ?? []).find(
            (p: { userId: string; online: boolean }) => p.userId === opponentUserId
          );
          if (entry && !hasLeft) {
            setOpponentStatus(entry.online ? "connected" : "disconnected");
          }
        } catch {
          // ignore
        }
      }

      signalPollId = setInterval(pollSignals, SIGNAL_POLL_INTERVAL_MS);
      void sendHeartbeat();
      heartbeatId = setInterval(sendHeartbeat, PRESENCE_HEARTBEAT_INTERVAL_MS);
      presencePollId = setInterval(pollPresence, PRESENCE_HEARTBEAT_INTERVAL_MS);
    }

    void setup();

    return () => {
      cancelled = true;
      if (signalPollId) clearInterval(signalPollId);
      if (heartbeatId) clearInterval(heartbeatId);
      if (presencePollId) clearInterval(presencePollId);
      if (!hasLeft) void postSignal("leave", null);
      pc?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      setConnectionStatus("idle");
      setOpponentStatus("connecting");
    };
  }, [active, matchId, isOfferer, opponentUserId]);

  return {
    localStream,
    remoteStream,
    cameraOn,
    micOn,
    cameraDenied,
    micDenied,
    connectionStatus,
    opponentStatus,
    toggleCamera,
    toggleMic,
  };
}
