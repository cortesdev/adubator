import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, PanResponder, ImageBackground, useWindowDimensions, SafeAreaView, Pressable, Image } from 'react-native';
import { useAudio, OscillatorType } from '../context/AudioContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, Rect, Polygon, Pattern, LinearGradient as SVGLinearGradient } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withTiming,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

// --- Theme Constants ---
const THEME = {
    BG_METAL: '#121212',
    PANEL_DARK: '#080808',
    SCREW_SILVER: '#555555',
    ACCENT_GREEN: '#10b981', // Neon Green
    ACCENT_YELLOW: '#fbbf24', // Amber
    ACCENT_RED: '#ef4444',    // Red
    TEXT_LABEL: '#e2dfc5', // Muted yellowish ink for printed effect
    KNOB_BODY: '#1a1a1a',
};

// --- Helper Components ---

// 0. High Fidelity "Industrial Matte" Board
const MetalSurface = ({ children, style }: { children: React.ReactNode, style?: any }) => {
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && width > 1200;

    // On desktop (>1200px), stick the background to the viewport to avoid scaling/scrolling weirdness.
    // On mobile (<1200px), let it be standard absolute positioning so it flows/zooms naturally.
    const bgStyle = isDesktop
        ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 } as const
        : StyleSheet.absoluteFill;

    return (
        <View style={[{ flex: 1, backgroundColor: '#1a1a1a', minHeight: Platform.OS === 'web' ? '100vh' : '100%' }, style]}>
            <ImageBackground
                source={require('../assets/images/bg_metal.png')}
                style={bgStyle as any}
                resizeMode="cover"
            />
            {/* Dark overlay for tint control */}
            <View style={{ ...bgStyle as any, backgroundColor: '#000', opacity: 0.2 }} />

            {children}
        </View>
    );
}



// 1. Realistic Engraved Bolts (Recessed into metal)
const Bolt = () => (
    <View
        {...({ className: "bolt-container" } as any)}
        style={{
            width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
        }}
    >


        <View
            {...({ className: "bolt-overflow-container" } as any)}
            style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden' }}
        >
            <Svg
                {...({ className: "bolt-svg" } as any)}
                width={24} height={24} viewBox="0 0 24 24"
            >
                <Defs>
                    {/* Deep Recessed Hole (Simulates Inner Shadow) */}
                    <RadialGradient id="holeDepth" cx="12" cy="12" r="12" fx="11" fy="11">
                        <Stop offset="0%" stopColor="#000" stopOpacity="0.95" />
                        <Stop offset="85%" stopColor="#000" stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#1a1a1a" stopOpacity="1" />
                    </RadialGradient>

                    {/* Bolt Head (Steel Finish, sitting deep) */}
                    <RadialGradient id="boltHead" cx="12" cy="12" r="8" fx="10" fy="10">
                        <Stop offset="0%" stopColor="#444" />
                        <Stop offset="70%" stopColor="#222" />
                        <Stop offset="100%" stopColor="#050505" />
                    </RadialGradient>

                    {/* Internal Hole Top-Left Shadow (Cast by the panel) */}
                    <SVGLinearGradient id="holeInnerShadow" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor="#000" stopOpacity="0.8" />
                        <Stop offset="40%" stopColor="transparent" />
                    </SVGLinearGradient>
                </Defs>

                {/* The Recessed Hole Body */}

                {/* The Bolt (Sitting deep in the hole) */}
                <Circle {...({ className: "bolt-head" } as any)} cx="12" cy="12" r="7" fill="url(#boltHead)" stroke="#000" strokeWidth="0.8" />

                {/* Industrial Drive Star */}
                <Path
                    {...({ className: "bolt-drive-star" } as any)}
                    d="M12 8 L13 11.2 L16.5 11.5 L13.8 13.5 L14.5 16.5 L12 15 L9.5 16.5 L10.2 13.5 L7.5 11.5 L11 11.2 Z"
                    fill="#000" opacity={0.9}
                />

                {/* Specular Highlight on Bolt Head */}
                <Circle {...({ className: "bolt-specular-highlight" } as any)} cx="10.5" cy="10.5" r="1.5" fill="white" opacity={0.05} />
            </Svg>
        </View>
    </View>
);

// 2. Waveform SVG Icons (Standard Synth Shapes)
const WaveIcon = ({ type, size = 14, color = '#666', opacity = 1 }: { type: OscillatorType, size?: number, color?: string, opacity?: number }) => {
    const props = { stroke: color, strokeWidth: 2, fill: "none", opacity, strokeLinecap: "round" as "round", strokeLinejoin: "round" as "round" };
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            {type === 'sine' && <Path d="M2 12 Q 7 2, 12 12 T 22 12" {...props} />}
            {type === 'square' && <Path d="M2 18 V 6 H 12 V 18 H 22" {...props} />}
            {type === 'triangle' && <Path d="M2 18 L 12 6 L 22 18" {...props} />}
            {type === 'sawtooth' && <Path d="M2 18 L 22 6 V 18" {...props} />}
        </Svg>
    );
};

// 3. Scalable Modular Knob (REVERTED TO STANDARD SHAPE + FIXED SHADOW)
const ModularKnob = ({
    value, min, max, onChange, label, color, units = '', size = 80, step = 0, showIcons = false,
}: {
    value: number, min: number, max: number, onChange: (val: number) => void, label: string, color: string, units?: string, size?: number, step?: number, showIcons?: boolean
}) => {
    const [rotation, setRotation] = useState(-140);

    // Ratios based on size
    const bodySize = size * 0.75;
    const indicatorH = size * 0.22;

    useEffect(() => {
        const percentage = (value - min) / (max - min);
        setRotation(-140 + (percentage * 280));
    }, [value, min, max]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: () => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
            },
            onPanResponderMove: (evt, gestureState) => {
                const delta = -gestureState.dy + gestureState.dx;
                const range = max - min;
                const valueDelta = (delta / (size * 2)) * range;
                let newValue = Math.max(min, Math.min(max, value + valueDelta));
                if (step > 0) newValue = Math.round(newValue / step) * step;
                onChange(newValue);
            },
        })
    ).current;

    // Ticks generation
    const ticks = Array.from({ length: 11 }).map((_, i) => {
        const angle = -140 + (i * 28);
        const isActive = angle <= rotation;
        return (
            <View key={i} style={{
                position: 'absolute',
                height: size * 1.15, width: 2,
                transform: [{ rotate: `${angle}deg` }],
                alignItems: 'center'
            }}>
                <View style={{
                    width: 2, height: 4,
                    backgroundColor: isActive ? color : '#333',
                    borderRadius: 1, top: 0,
                    shadowColor: isActive ? color : 'transparent', shadowRadius: 3, shadowOpacity: 1
                }} />
            </View>
        );
    });

    return (
        <View style={{ alignItems: 'center', width: size * 1.5, height: size * 1.5, justifyContent: 'center' }}>

            {/* LFO Icons Ring */}
            {showIcons && (
                <View style={{ ...StyleSheet.absoluteFillObject }} pointerEvents="none">
                    <View style={{ position: 'absolute', top: size * 1.0, left: size * 0.05 }}><WaveIcon type='sine' size={14} color={color} opacity={value === 0 ? 1 : 0.3} /></View>
                    <View style={{ position: 'absolute', top: size * 0.1, left: size * 0.1 }}><WaveIcon type='square' size={14} color={color} opacity={value === 1 ? 1 : 0.3} /></View>
                    <View style={{ position: 'absolute', top: size * 0.1, right: size * 0.1 }}><WaveIcon type='triangle' size={14} color={color} opacity={value === 2 ? 1 : 0.3} /></View>
                    <View style={{ position: 'absolute', top: size * 1.0, right: size * 0.05 }}><WaveIcon type='sawtooth' size={14} color={color} opacity={value === 3 ? 1 : 0.3} /></View>
                </View>
            )}

            {/* Ticks Ring */}
            <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>{ticks}</View>

            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }} {...panResponder.panHandlers}>

                {/* Backlight Glow (Subtle) */}
                <View style={{
                    position: 'absolute', width: bodySize, height: bodySize, borderRadius: bodySize,
                    backgroundColor: color, opacity: 0.1,
                    shadowColor: color, shadowRadius: size * 0.5, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 }
                }} />

                {/* FIXED DIRECTIONAL SHADOW (Does not rotate) */}
                <View style={{
                    position: 'absolute',
                    width: bodySize, height: bodySize, borderRadius: bodySize / 2,
                    backgroundColor: '#000',
                    shadowColor: '#000',
                    shadowOffset: { width: size * 0.15, height: size * 0.25 },
                    shadowOpacity: 0.8,
                    shadowRadius: size * 0.2,
                    elevation: 5,
                    opacity: 1
                }} />

                {/* DUAL DYNAMICS DIFFRACTION (Simulating environmental light spill) */}
                <View style={{
                    position: 'absolute', width: bodySize, height: bodySize, borderRadius: bodySize / 2,
                    overflow: 'hidden', pointerEvents: 'none'
                }}>
                    {/* RED LIGHT (Bottom-Right) */}
                    <LinearGradient
                        colors={['transparent', 'rgba(239, 68, 68, 0.5)']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* GREEN LIGHT (Top-Left) */}
                    <LinearGradient
                        colors={['rgba(34, 197, 94, 0.3)', 'transparent']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                {/* Knob Body (Rotates freely) */}
                <Animated.View style={{
                    width: bodySize, height: bodySize, borderRadius: bodySize / 2,
                    transform: [{ rotate: `${rotation}deg` }],
                }}>
                    <LinearGradient colors={['#2a2a2a', '#111']} style={{
                        flex: 1, borderRadius: bodySize / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333'
                    }}>
                        {/* Indicator (Positional Marker with Glow) */}
                        <View style={{
                            position: 'absolute', top: 4 * (size / 100), width: size * 0.08, height: indicatorH, borderRadius: 2, zIndex: 10,
                            backgroundColor: color, shadowColor: color, shadowOpacity: 1, shadowRadius: 12,
                            borderWidth: 0,
                            elevation: 5
                        }} />

                        {/* Metallic Cap Base (Rotates) */}
                        <LinearGradient colors={['#333', '#111']} style={{
                            width: '85%', height: '85%', borderRadius: 100, borderWidth: 1, borderColor: '#000',
                            justifyContent: 'center', alignItems: 'center'
                        }}>
                            <View style={{ width: '100%', height: '100%', borderRadius: 100, backgroundColor: color, opacity: 0.08 }} />
                        </LinearGradient>
                    </LinearGradient>
                </Animated.View>

                {/* STATIC LIGHT REFLECTIONS (Placed on top of rotating knob) */}
                <View style={{ position: 'absolute', width: bodySize, height: bodySize, borderRadius: bodySize / 2, pointerEvents: 'none' }}>
                    {/* Top Shine (Static light source reflection) */}
                    <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'transparent']}
                        style={{ position: 'absolute', width: '55%', height: '45%', top: '5%', alignSelf: 'center', borderRadius: 100 }}
                    />
                    {/* Bottom Bounce Light */}
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.12)']}
                        style={{ position: 'absolute', width: '70%', height: '45%', bottom: '5%', alignSelf: 'center', borderRadius: 100 }}
                    />
                </View>
            </View>

            <View style={{ alignItems: 'center', marginTop: -2 }}>
                <Text style={{
                    color: THEME.TEXT_LABEL, fontSize: 8, fontWeight: '700',
                    letterSpacing: 0.5, opacity: 0.85,
                    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1.2
                }}>{label}</Text>
            </View>
        </View>
    );
};

// 4. Realistic Toggle
const MetalSwitch = ({ label, active, onPress, scale = 1 }: { label: string, active: boolean, onPress: () => void, scale?: number }) => {
    return (
        <TouchableOpacity style={{ alignItems: 'center', gap: 8 * scale, width: 50 * scale }} onPress={onPress}>
            <View style={{
                width: 24 * scale, height: 42 * scale, backgroundColor: '#050505', borderRadius: 4,
                borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center',
                shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05
            }}>
                <View style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 4, borderWidth: 1, borderColor: '#000', opacity: 0.6 }} />

                {/* Lever */}
                <LinearGradient
                    colors={['#999', '#555']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                        width: 18 * scale, height: 26 * scale, borderRadius: 2,
                        transform: [{ translateY: active ? -9 * scale : 9 * scale }],
                        borderWidth: 0.5, borderColor: '#000', elevation: 5,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.6
                    }}
                >
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: '20%', height: '70%', backgroundColor: 'rgba(0,0,0,0.15)' }} />
                    </View>
                </LinearGradient>
            </View>
            <Text style={{
                fontSize: 10 * scale, color: active ? '#fff' : THEME.TEXT_LABEL,
                fontWeight: 'bold', opacity: active ? 1 : 0.85,
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center',
                textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: active ? 0 : 1.2
            }}>{label}</Text>
        </TouchableOpacity>
    );
}

// 4.5 Preset Button (Mini Square)
const PresetButton = ({ label, onPress, onLongPress, isActive }: { label: string, onPress: () => void, onLongPress: () => void, isActive: boolean }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={500}
            activeOpacity={0.8}
            style={{
                width: 50, height: 40, justifyContent: 'center', alignItems: 'center'
            }}
        >
            {/* FIXED DIRECTIONAL SHADOW (Outer Depth) */}
            <View style={{
                position: 'absolute',
                width: 50, height: 40, borderRadius: 6,
                backgroundColor: '#000',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 6 }, // Directional cast
                shadowOpacity: 0.8,
                shadowRadius: 5,
                elevation: 5, // Android depth
                zIndex: -1
            }} />

            <View style={{
                width: '100%', height: '100%',
                backgroundColor: '#111', borderRadius: 6,
                borderWidth: 2, borderColor: isActive ? THEME.ACCENT_RED : '#333',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: isActive ? THEME.ACCENT_RED : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isActive ? 0.5 : 0.8,
                shadowRadius: isActive ? 8 : 4
            }}>
                {/* Inner Bevel */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#333', opacity: 0.5 }} />

                <Text style={{
                    color: isActive ? '#fff' : THEME.TEXT_LABEL,
                    fontSize: 16, fontWeight: '900',
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                    textShadowColor: isActive ? THEME.ACCENT_RED : 'transparent',
                    textShadowRadius: 5
                }}>{label}</Text>
            </View>
        </TouchableOpacity>
    );
};

// 5. Grid Visualizer with "Black Grade" Background
const RackVisualizer = ({ analyserNode, isPlaying, height = 40, width }: { analyserNode: AnalyserNode | null, isPlaying: boolean, height?: number, width: number }) => {
    const [levels, setLevels] = useState(new Array(32).fill(0));
    useEffect(() => {
        if (Platform.OS === 'web' && analyserNode) {
            let animId: number;
            const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
            const update = () => {
                if (!isPlaying) { setLevels(new Array(32).fill(0)); return; }
                analyserNode.getByteFrequencyData(dataArray);
                const newLevels = [];
                for (let i = 0; i < 32; i++) {
                    const bin = Math.floor(i * 0.8);
                    const val = dataArray[bin] || 0;
                    newLevels.push(val / 255);
                }
                setLevels(newLevels);
                animId = requestAnimationFrame(update);
            };
            update();
            return () => cancelAnimationFrame(animId);
        } else {
            if (isPlaying) {
                const interval = setInterval(() => { setLevels(prev => prev.map(() => Math.random())); }, 100);
                return () => clearInterval(interval);
            } else { setLevels(new Array(32).fill(0)); }
        }
    }, [analyserNode, isPlaying]);

    return (
        <View style={{
            width: '100%', height: height, backgroundColor: '#000',
            borderRadius: 6, padding: 4, borderWidth: 2, borderColor: '#222',
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.9,
            overflow: 'hidden'
        }}>
            {/* "Black Grade" Background */}
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                <Defs>
                    <RadialGradient id="screenGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                        <Stop offset="0%" stopColor="#222" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="#000" stopOpacity="0.9" />
                    </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#screenGrad)" />
            </Svg>

            {/* Ghost Gradient */}
            <LinearGradient
                colors={[THEME.ACCENT_GREEN, THEME.ACCENT_YELLOW, THEME.ACCENT_RED]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ ...StyleSheet.absoluteFillObject, opacity: 0.1 }}
            />

            <View style={{ flex: 1, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 2 }}>

                {/* Visualizer Bars */}
                <View style={{ flex: 1, flexDirection: 'row', gap: 1, alignItems: 'flex-end', opacity: 0.95 }}>
                    {levels.map((lvl, index) => {
                        let barColor = THEME.ACCENT_GREEN;
                        if (index > 20) barColor = THEME.ACCENT_YELLOW;
                        if (index > 28) barColor = THEME.ACCENT_RED;
                        return (
                            <View key={index} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                                <View style={{
                                    height: `${Math.max(5, lvl * 100)}%`, backgroundColor: barColor,
                                    opacity: lvl > 0.05 ? 1 : 0.0,
                                    shadowColor: barColor,
                                    shadowRadius: isPlaying ? 10 : 0,
                                    shadowOpacity: isPlaying ? 0.9 : 0,
                                    shadowOffset: { width: 0, height: 0 },
                                    elevation: isPlaying ? 5 : 0 // Android
                                }} />
                            </View>
                        )
                    })}
                </View>

                {/* Grid Overlay - High Density (64 lines total) */}
                <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 10 }} pointerEvents="none">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <View key={`h-${i}`} style={{ position: 'absolute', top: `${i * 12.5}%`, width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.8)' }} />
                    ))}
                    {Array.from({ length: 32 }).map((_, i) => (
                        <View key={`v-${i}`} style={{ position: 'absolute', left: `${i * (100 / 32)}%`, height: '100%', width: 1, backgroundColor: 'rgba(0,0,0,0.8)' }} />
                    ))}
                </View>
            </View>

            {/* Glossy Screen Reflection */}
            <LinearGradient colors={['rgba(255,255,255,0.02)', 'transparent', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
        </View>
    );
};

const Separator = () => (
    <View style={{ paddingHorizontal: '12%', marginVertical: 2 }}>
        <View style={{ width: '100%', height: 1, backgroundColor: '#000' }} />
        <View style={{ width: '100%', height: 0.8, backgroundColor: '#b6b28a60', opacity: 0.3 }} />
    </View>
);

const HomeScreen = () => {
    const {
        isPlaying, playSiren, stopSiren,
        pitch, setPitch,
        waveform, setWaveform,
        modSpeed, setModSpeed, modDepth, setModDepth, modWaveform, setModWaveform,
        delayTime, setDelayTime, delayFeedback, setDelayFeedback,
        delayCutoff, setDelayCutoff, delayFactor, setDelayFactor,
        isSynced, setIsSynced, triggerTap,
        volume, setVolume, analyserNode
    } = useAudio();

    const { width, height } = useWindowDimensions();
    const [isBooting, setIsBooting] = useState(true);
    const bootAnim = useSharedValue(0);

    // Unified Scaling (Preserving mobile feel across all screens)
    const scale = 1;
    const knobSize = 70;
    const padding = 16;

    useEffect(() => {
        bootAnim.value = withTiming(1, { duration: 1800 });
        const timer = setTimeout(() => setIsBooting(false), 2600);
        return () => clearTimeout(timer);
    }, []);

    // --- Preset Logic (Defined Early) ---
    const [presets, setPresets] = useState<Record<string, any>>({
        'A': { pitch: 150, modSpeed: 2, modDepth: 50, delayTime: 0.3, delayFeedback: 0.5, delayCutoff: 1000, volume: 0.9, waveform: 'triangle', modWaveform: 'sine' },
        'B': { pitch: 550, modSpeed: 12, modDepth: 300, delayTime: 0.2, delayFeedback: 0.3, delayCutoff: 3000, volume: 0.9, waveform: 'square', modWaveform: 'sawtooth' },
        'C': { pitch: 300, modSpeed: 0.5, modDepth: 400, delayTime: 0.6, delayFeedback: 0.8, delayCutoff: 1500, volume: 0.9, waveform: 'sine', modWaveform: 'square' },
    });
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const savePreset = (id: string) => {
        // Only save Oscillator/LFO params; Echo & Volume are global
        const currentSettings = {
            pitch, modSpeed, modDepth, waveform, modWaveform
        };
        setPresets(prev => ({ ...prev, [id]: currentSettings }));
        setActivePreset(id);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log(`Preset ${id} saved (excluding echo/vol):`, currentSettings);
    };

    const loadPreset = (id: string) => {
        // 1. Auto-save current active preset state before switching (Osc/LFO only)
        if (activePreset) {
            const currentSettings = {
                pitch, modSpeed, modDepth, waveform, modWaveform
            };
            setPresets(prev => ({ ...prev, [activePreset]: currentSettings }));
        }

        // 2. Load the new preset (Osc/LFO only)
        const data = presets[id];
        if (data) {
            setPitch(data.pitch);
            setModSpeed(data.modSpeed);
            setModDepth(data.modDepth);
            // GLOBAL PARAMS - DO NOT LOAD
            // Echo: Time, Feedback, Filter
            // Mix: Volume

            setWaveform(data.waveform);
            setModWaveform(data.modWaveform);
            setActivePreset(id);
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            console.log(`Preset ${id} loaded (echo/vol persisted)`);
        } else {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // Animations & Styles
    const triggerPulse = useSharedValue(1);
    useEffect(() => {
        triggerPulse.value = isPlaying ? withRepeat(withTiming(1.02, { duration: 100 }), -1, true) : withTiming(1);
    }, [isPlaying]);

    const triggerStyle = useAnimatedStyle(() => ({ transform: [{ scale: triggerPulse.value }] }));

    const bootStyle = useAnimatedStyle(() => ({
        opacity: bootAnim.value,
        transform: [{ scale: withSpring(0.95 + (bootAnim.value * 0.05)) }]
    }));

    // Waveform Helpers
    const handleShapeChange = (val: number) => {
        const shapes: OscillatorType[] = ['sine', 'square', 'triangle', 'sawtooth'];
        const index = Math.round(val);
        if (shapes[index]) setModWaveform(shapes[index]);
    };
    const currentShapeIndex = ['sine', 'square', 'triangle', 'sawtooth'].indexOf(modWaveform);

    // Keyboard Shortcuts Support
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                playSiren();
            } else if (e.key.toLowerCase() === 'a') {
                loadPreset('A');
            } else if (e.key.toLowerCase() === 'b') {
                loadPreset('B');
            } else if (e.key.toLowerCase() === 'c') {
                loadPreset('C');
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                stopSiren();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [playSiren, stopSiren, presets]);

    if (isBooting) {
        return (
            <MetalSurface style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Animated.View style={[{ alignItems: 'center' }, bootStyle]}>
                    <Image
                        source={require('../../assets/icon.png')}
                        style={{ width: 120, height: 120, marginBottom: 30, borderRadius: 20 }}
                        resizeMode="contain"
                    />
                    <Text style={{
                        color: THEME.TEXT_LABEL,
                        fontSize: 32,
                        fontWeight: '200',
                        letterSpacing: 10,
                        opacity: 0.9,
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        textShadowColor: THEME.TEXT_LABEL,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 15,
                    }}>
                        Modular{"\n"}Dub Siren
                    </Text>
                    <View style={{ height: 1, width: 150, backgroundColor: THEME.TEXT_LABEL, opacity: 0.2, marginVertical: 30 }} />
                    <Text style={{
                        color: THEME.TEXT_LABEL,
                        fontSize: 10,
                        letterSpacing: 4,
                        opacity: 0.4,
                    }}>
                        SYSTEM INITIALIZING...
                    </Text>
                </Animated.View>
            </MetalSurface>
        );
    }


    return (
        <MetalSurface style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* --- Header --- */}
                <View style={[styles.header, { paddingVertical: 12, paddingHorizontal: 16 }]}>
                    <Bolt />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.headerText, { fontSize: 18 }]}>MODULAR DUB SIREN</Text>
                    </View>
                    <Bolt />
                </View>
                {/* Header 3D Highlight */}
                <View style={{ width: '100%', height: 0.8, backgroundColor: '#b6b28a60', opacity: 0.3 }} />

                {/* --- Modules Rack --- */}
                <View style={{ flex: 1, paddingHorizontal: padding, paddingTop: 10, justifyContent: 'space-between' }}>

                    {/* Top Group: Knobs */}
                    <View>
                        {/* Row 1: SIREN (Green) */}
                        <View style={styles.row}>
                            <View style={[styles.sideLabel, width > 900 && { left: '18%', width: 'auto' }]}><Text style={[styles.sectionTitle, { color: THEME.ACCENT_GREEN }]}>Siren</Text></View>
                            <ModularKnob value={pitch} min={50} max={800} onChange={setPitch} label="PITCH" color={THEME.ACCENT_GREEN} size={knobSize} />
                            <ModularKnob value={modDepth} min={0} max={500} onChange={setModDepth} label="MOD" color={THEME.ACCENT_GREEN} size={knobSize} />
                            <ModularKnob value={modSpeed} min={0.1} max={20} onChange={setModSpeed} label="RATE" color={THEME.ACCENT_GREEN} size={knobSize} />
                        </View>

                        <Separator />

                        {/* Row 2: LFO (Yellow) */}
                        <View style={styles.row}>
                            <View style={[styles.sideLabel, width > 900 && { left: '18%', width: 'auto' }]}><Text style={[styles.sectionTitle, { color: THEME.ACCENT_YELLOW }]}>LFO</Text></View>
                            <ModularKnob
                                value={currentShapeIndex} min={0} max={3} step={1}
                                onChange={handleShapeChange} label="SHAPE" color={THEME.ACCENT_YELLOW} size={knobSize}
                                showIcons={true}
                            />
                            <ModularKnob value={modSpeed} min={0.1} max={20} onChange={setModSpeed} label="RATE" color={THEME.ACCENT_YELLOW} size={knobSize} />
                            <ModularKnob value={modDepth} min={0} max={500} onChange={setModDepth} label="DEPTH" color={THEME.ACCENT_YELLOW} size={knobSize} />
                        </View>

                        <Separator />

                        {/* Row 3: ECHO (Red) */}
                        <View style={styles.row}>
                            <View style={[styles.sideLabel, width > 900 && { left: '18%', width: 'auto' }]}><Text style={[styles.sectionTitle, { color: THEME.ACCENT_RED }]}>Echo</Text></View>
                            <ModularKnob value={delayTime} min={0.05} max={1.0} onChange={setDelayTime} label="TIME" color={THEME.ACCENT_RED} size={knobSize} />
                            <ModularKnob value={delayFeedback} min={0} max={0.9} onChange={setDelayFeedback} label="FDBK" color={THEME.ACCENT_RED} size={knobSize} />
                            <ModularKnob value={delayCutoff} min={100} max={5000} onChange={setDelayCutoff} label="FILTER" color={THEME.ACCENT_RED} size={knobSize} />
                        </View>
                    </View>

                    {/* Bottom Group: Performance Controls & Visuals */}
                    <View style={{ marginBottom: 10 }}>
                        {/* Controls Row (Switches & BPM) */}
                        <View style={{ marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Left: Waveform & Sync */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 * scale }}>
                                <MetalSwitch label="SINE" active={waveform === 'sine'} onPress={() => setWaveform('sine')} scale={scale} />
                                <MetalSwitch label="SYNC" active={isSynced} onPress={() => setIsSynced(!isSynced)} scale={scale} />
                            </View>

                            {/* Center-Left: BPM Display */}
                            <TouchableOpacity
                                onPress={triggerTap}
                                activeOpacity={0.7}
                                style={{
                                    backgroundColor: '#100000', borderWidth: 2, borderColor: '#551111', borderRadius: 6,
                                    paddingHorizontal: 12 * scale, paddingVertical: 6 * scale,
                                    shadowColor: '#f00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10,
                                    justifyContent: 'center', alignItems: 'center', minWidth: 80 * scale
                                }}>
                                <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#ff1111', fontSize: 16 * scale, fontWeight: 'bold', textShadowColor: '#f00', textShadowRadius: 8 }}>
                                    {(modSpeed * 60).toFixed(0)} <Text style={{ fontSize: 8 * scale, color: '#a00' }}>BPM</Text>
                                </Text>
                                <LinearGradient colors={['rgba(255,255,255,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
                            </TouchableOpacity>

                            {/* Center-Right: MIX Knob */}
                            <View style={{ alignItems: 'center', marginTop: -5 * scale }}>
                                <ModularKnob value={volume} min={0} max={1} onChange={setVolume} label="MIX" color={THEME.ACCENT_RED} size={knobSize * 0.8} />
                            </View>

                            {/* Right: Waveform */}
                            <MetalSwitch label="SQR" active={waveform === 'square'} onPress={() => setWaveform('square')} scale={scale} />
                        </View>

                        {/* Spectrum Overlay Area */}
                        <View style={{ height: 110, width: '100%', justifyContent: 'center' }}>
                            <RackVisualizer analyserNode={analyserNode} isPlaying={isPlaying} width={width} height={110} />

                            {/* FYAH Button Anchored over Spectrum */}
                            <Pressable
                                onPressIn={() => playSiren()}
                                onPressOut={() => stopSiren()}
                                style={{ position: 'absolute', alignSelf: 'center', zIndex: 20, width: 140, height: 100 }}
                                {...(Platform.OS === 'web' ? {
                                    onMouseLeave: () => stopSiren(),
                                } : {})}
                            >
                                <View style={{ width: 140, height: 100, justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{
                                        position: 'absolute', width: '105%', height: '110%',
                                        backgroundColor: '#000', borderRadius: 16,
                                        borderWidth: 2, borderColor: '#1a1a1a',
                                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 4
                                    }} />
                                    <View style={{
                                        position: 'absolute', width: '92%', height: '88%',
                                        borderRadius: 12, borderWidth: 7.,
                                        borderColor: isPlaying ? 'rgba(239, 68, 68, 0.8)' : '#ffffff80',
                                        zIndex: 5,
                                        shadowColor: '#ef4444', shadowRadius: isPlaying ? 20 : 0, shadowOpacity: isPlaying ? 0.9 : 0
                                    }} />
                                    <Animated.View style={[
                                        triggerStyle,
                                        {
                                            width: '90%', height: '85%',
                                            borderRadius: 10, overflow: 'hidden',
                                            borderWidth: 1.5, borderColor: isPlaying ? 'rgba(239, 68, 68, 0.4)' : '#222',
                                            zIndex: 4,
                                        }
                                    ]}>
                                        <LinearGradient
                                            colors={isPlaying ? ['#1a1a1a', '#0a0a0a'] : ['#2a2a2a', '#181818']}
                                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                        >
                                            <Text style={{
                                                fontSize: 26, fontWeight: '900', letterSpacing: 4,
                                                color: isPlaying ? '#ff4b33ff' : 'rgba(255, 255, 255, 0.65)',
                                                opacity: 1,
                                                textShadowColor: isPlaying ? '#ff0000' : 'rgba(0,0,0,0.5)',
                                                textShadowRadius: isPlaying ? 15 : 1.2,
                                                textShadowOffset: isPlaying ? { width: 0, height: 0 } : { width: 0, height: 1 }
                                            }}>FYAH</Text>
                                            {isPlaying && (
                                                <View style={{
                                                    ...StyleSheet.absoluteFillObject,
                                                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                                    zIndex: -1
                                                }} />
                                            )}
                                        </LinearGradient>
                                    </Animated.View>
                                </View>
                            </Pressable>
                        </View>

                        {/* Presets Row (A, B, C) */}
                        <View style={{ alignItems: 'center', marginTop: 15, paddingBottom: 30, zIndex: 10 }}>
                            <Text style={{
                                color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 8,
                                fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif'
                            }}>
                                PRESETS (HOLD TO OVERWRITE)
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                                {['A', 'B', 'C'].map((id) => (
                                    <PresetButton
                                        key={id}
                                        label={id}
                                        onPress={() => {
                                            if (presets[id]) {
                                                loadPreset(id);
                                            } else {
                                                savePreset(id);
                                            }
                                        }}
                                        onLongPress={() => savePreset(id)}
                                        isActive={activePreset === id}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bottom Screws */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 20, zIndex: -1 }}>
                    <Bolt />
                    <Bolt />
                </View>
            </SafeAreaView>
        </MetalSurface>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: 'transparent',
    },
    headerText: {
        color: THEME.TEXT_LABEL, fontWeight: '900', letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
        opacity: 0.9,
        textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1.5
    },
    sectionHeader: { position: 'absolute', top: -16, left: 0 },
    sideLabel: {
        position: 'absolute', left: -10, width: '10%',
        justifyContent: 'center', alignItems: 'center',
        height: '100%', zIndex: 10
    },
    sectionTitle: {
        fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
        opacity: 0.8, color: THEME.TEXT_LABEL,
        textShadowColor: '#000', textShadowRadius: 1.2
    },
    row: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 1,
        gap: 15
    },
    fireButton: {
        backgroundColor: '#000', borderRadius: 16,
        borderWidth: 4, padding: 6,
        elevation: 10
    }
});

export default HomeScreen;
