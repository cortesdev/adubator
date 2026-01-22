import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { WebViewAudioEngine } from '../components/WebViewAudioEngine';

export type OscillatorType = 'sine' | 'square' | 'triangle' | 'sawtooth';

type AudioContextType = {
    isPlaying: boolean;

    // Carrier
    pitch: number;
    setPitch: (val: number) => void;
    waveform: OscillatorType;
    setWaveform: (val: OscillatorType) => void;

    // LFO
    modSpeed: number;
    setModSpeed: (val: number) => void;
    modDepth: number;
    setModDepth: (val: number) => void;
    modWaveform: OscillatorType;
    setModWaveform: (val: OscillatorType) => void;

    // Output
    volume: number;
    setVolume: (val: number) => void;

    // Delay
    delayTime: number;
    setDelayTime: (val: number) => void;
    delayFeedback: number;
    setDelayFeedback: (val: number) => void;

    // Actions
    playSiren: () => void;
    stopSiren: () => void;
    triggerTap: () => void;

    // New Params
    delayCutoff: number;
    setDelayCutoff: (val: number) => void;
    delayFactor: number;
    setDelayFactor: (val: number) => void;
    isSynced: boolean;
    setIsSynced: (val: boolean) => void;

    // Tools
    analyserNode: AnalyserNode | null;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- State ---
    const [isPlaying, setIsPlaying] = useState(false);

    // Carrier
    const [pitch, setPitch] = useState(440);
    const [waveform, setWaveform] = useState<OscillatorType>('square');

    // LFO
    const [modSpeed, setModSpeed] = useState(5);
    const [modDepth, setModDepth] = useState(50);
    const [modWaveform, setModWaveform] = useState<OscillatorType>('sine');

    // Echo
    const [delayTime, setDelayTime] = useState(0.3);
    const [delayFeedback, setDelayFeedback] = useState(0.4);
    const [delayCutoff, setDelayCutoff] = useState(2000);
    const [delayFactor, setDelayFactor] = useState(1.0);
    const [isSynced, setIsSynced] = useState(false);
    const [tapTimes, setTapTimes] = useState<number[]>([]);

    // Output
    const [volume, setVolume] = useState(0.8);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

    // --- Refs ---
    const ctxRef = useRef<AudioContext | null>(null);
    const mainOscRef = useRef<OscillatorNode | null>(null);
    const modOscRef = useRef<OscillatorNode | null>(null);
    const modGainRef = useRef<GainNode | null>(null);
    const outputGainRef = useRef<GainNode | null>(null);
    const delayNodeRef = useRef<DelayNode | null>(null);
    const echoFeedbackRef = useRef<GainNode | null>(null);
    const echoFilterRef = useRef<BiquadFilterNode | null>(null);

    // --- Init ---
    useEffect(() => {
        const initAudio = async () => {
            if (Platform.OS !== 'web') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
                return;
            }

            if (Platform.OS === 'web') {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContextClass();
                ctxRef.current = ctx;

                const outGain = ctx.createGain();
                outGain.gain.value = volume;

                // Analyser
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64; // Low res for retro bar look

                // Chain: OutGain -> Analyser -> Dest
                outGain.connect(analyser);
                analyser.connect(ctx.destination);

                outputGainRef.current = outGain;
                setAnalyserNode(analyser); // Expose to state

                // Resume context if needed
                const resumeEvents = ['click', 'keydown', 'touchstart'];
                const resume = () => {
                    if (ctx.state === 'suspended') ctx.resume();
                };
                resumeEvents.forEach(e => document.addEventListener(e, resume));
            }
        };
        initAudio();
        return () => {
            ctxRef.current?.close();
        };
    }, []);

    // --- Parameter Updates ---
    useEffect(() => {
        if (outputGainRef.current) {
            outputGainRef.current.gain.setTargetAtTime(volume, ctxRef.current?.currentTime || 0, 0.01);
        }
    }, [volume]);

    useEffect(() => {
        if (mainOscRef.current) {
            mainOscRef.current.frequency.setTargetAtTime(pitch, ctxRef.current?.currentTime || 0, 0.01);
        }
    }, [pitch]);

    useEffect(() => {
        if (modOscRef.current) {
            modOscRef.current.frequency.setTargetAtTime(modSpeed, ctxRef.current?.currentTime || 0, 0.01);
        }
    }, [modSpeed]);

    useEffect(() => {
        if (modGainRef.current) {
            modGainRef.current.gain.setTargetAtTime(modDepth, ctxRef.current?.currentTime || 0, 0.01);
        }
    }, [modDepth]);

    useEffect(() => {
        if (delayNodeRef.current && ctxRef.current) {
            delayNodeRef.current.delayTime.setTargetAtTime(delayTime, ctxRef.current.currentTime, 0.01);
        }
    }, [delayTime]);

    useEffect(() => {
        if (echoFeedbackRef.current) {
            echoFeedbackRef.current.gain.setTargetAtTime(delayFeedback, ctxRef.current?.currentTime || 0, 0.01);
        }
    }, [delayFeedback]);

    useEffect(() => {
        if (echoFilterRef.current) {
            echoFilterRef.current.frequency.setTargetAtTime(delayCutoff, ctxRef.current?.currentTime || 0, 0.01);
        }
    }, [delayCutoff]);

    const triggerTap = useCallback(() => {
        const now = Date.now();
        const newTaps = [...tapTimes, now].slice(-4);
        setTapTimes(newTaps);

        if (newTaps.length >= 2) {
            const diffs = [];
            for (let i = 1; i < newTaps.length; i++) {
                diffs.push(newTaps[i] - newTaps[i - 1]);
            }
            const avgDiff = diffs.reduce((a, b) => a + b) / diffs.length;
            const bpm = 60000 / avgDiff;
            const freq = bpm / 60;
            if (isSynced) {
                setModSpeed(freq);
            }
        }
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [tapTimes, isSynced]);


    // --- Actions ---
    const playSiren = useCallback(async () => {
        if (isPlaying) return;
        // UI Feedback (works on all platforms)
        setIsPlaying(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const ctx = ctxRef.current;
        if (!ctx || !outputGainRef.current) return;

        if (ctx.state === 'suspended') await ctx.resume();

        const t = ctx.currentTime;

        // 1. Oscillators
        const mainOsc = ctx.createOscillator();
        mainOsc.type = waveform;
        mainOsc.frequency.value = pitch;

        const modOsc = ctx.createOscillator();
        modOsc.type = modWaveform;
        modOsc.frequency.value = modSpeed;

        const modGain = ctx.createGain();
        modGain.gain.value = modDepth;

        // 2. Delay Chain
        const delay = ctx.createDelay(5.0);
        delay.delayTime.value = delayTime;

        const feedback = ctx.createGain();
        feedback.gain.value = delayFeedback;

        const filter = ctx.createBiquadFilter();
        filter.frequency.value = delayCutoff;

        // 3. Connect Graph
        // LFO -> Freq
        modOsc.connect(modGain);
        modGain.connect(mainOsc.frequency);

        // Signal -> Output
        mainOsc.connect(outputGainRef.current);

        // Echo Send
        mainOsc.connect(delay);
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);
        feedback.connect(outputGainRef.current);

        // 4. Start
        mainOsc.start(t);
        modOsc.start(t);

        // 5. Store
        mainOscRef.current = mainOsc;
        modOscRef.current = modOsc;
        modGainRef.current = modGain;
        delayNodeRef.current = delay;
        echoFeedbackRef.current = feedback;
        echoFilterRef.current = filter;

    }, [isPlaying, pitch, waveform, modSpeed, modDepth, modWaveform, delayTime, delayFeedback]);

    const stopSiren = useCallback(() => {
        if (!isPlaying) return;
        setIsPlaying(false);
        const t = ctxRef.current?.currentTime || 0;

        // Stop Oscillators with release
        if (mainOscRef.current) {
            mainOscRef.current.stop(t + 0.1);
            mainOscRef.current.disconnect(outputGainRef.current!);
            if (delayNodeRef.current) mainOscRef.current.disconnect(delayNodeRef.current);
            mainOscRef.current = null;
        }
        if (modOscRef.current) {
            modOscRef.current.stop(t + 0.1);
            modOscRef.current.disconnect();
            modOscRef.current = null;
        }
    }, [isPlaying]);



    return (
        <AudioContext.Provider
            value={{
                isPlaying,
                volume, setVolume,
                pitch, setPitch,
                waveform, setWaveform,
                modSpeed, setModSpeed,
                modDepth, setModDepth,
                modWaveform, setModWaveform,
                delayTime, setDelayTime,
                delayFeedback, setDelayFeedback,
                delayCutoff, setDelayCutoff,
                delayFactor, setDelayFactor,
                isSynced, setIsSynced,
                playSiren,
                stopSiren,
                triggerTap,
                analyserNode
            }}
        >
            {Platform.OS !== 'web' && (
                <WebViewAudioEngine
                    isPlaying={isPlaying}
                    pitch={pitch}
                    waveform={waveform}
                    modSpeed={modSpeed}
                    modDepth={modDepth}
                    modWaveform={modWaveform}
                    delayTime={delayTime}
                    delayFeedback={delayFeedback}
                    delayCutoff={delayCutoff}
                    volume={volume}
                />
            )}
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
};

export default AudioContext;