import React, { useEffect, useRef } from 'react';
import { View, AppState } from 'react-native';
import { WebView } from 'react-native-webview';

// Maps to the exact params in AudioContext
interface AudioEngineProps {
    isPlaying: boolean;
    pitch: number;
    waveform: string;
    modSpeed: number;
    modDepth: number;
    modWaveform: string;
    delayTime: number;
    delayFeedback: number;
    delayCutoff: number;
    volume: number;
}

export const WebViewAudioEngine: React.FC<AudioEngineProps> = ({
    isPlaying,
    pitch,
    waveform,
    modSpeed,
    modDepth,
    modWaveform,
    delayTime,
    delayFeedback,
    delayCutoff,
    volume,
}) => {
    const webViewRef = useRef<WebView>(null);

    // Send updates when parameters change
    useEffect(() => {
        const payload = JSON.stringify({
            type: 'UPDATE',
            data: { pitch, waveform, modSpeed, modDepth, modWaveform, delayTime, delayFeedback, delayCutoff, volume }
        });
        webViewRef.current?.injectJavaScript(`window.handleMessage(${payload}); true;`);
    }, [pitch, waveform, modSpeed, modDepth, modWaveform, delayTime, delayFeedback, delayCutoff, volume]);

    // Handle Play/Stop
    useEffect(() => {
        const type = isPlaying ? 'PLAY' : 'STOP';
        webViewRef.current?.injectJavaScript(`window.handleMessage(${JSON.stringify({ type })}); true;`);
    }, [isPlaying]);

    // Handle AppState (Resume Audio on Foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                webViewRef.current?.injectJavaScript(`
                    if (ctx && ctx.state === 'suspended') ctx.resume();
                    true;
                `);
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Audio Engine</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <script>
            let ctx = null;
            let outputGain = null;
            let nodes = {};
            let isPlaying = false;
            
            // State
            let params = {
                pitch: 440,
                waveform: 'square',
                modSpeed: 5,
                modDepth: 50,
                modWaveform: 'sine',
                delayTime: 0.3,
                delayFeedback: 0.4,
                delayCutoff: 2000,
                volume: 0.8
            };

            function initAudio() {
                if (ctx) return;
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                ctx = new AudioContextClass();
                outputGain = ctx.createGain();
                outputGain.connect(ctx.destination);
            }

            // Global handler called by injectJavaScript
            window.handleMessage = function(msg) {
                if (!ctx) initAudio();

                if (msg.type === 'UPDATE') {
                    Object.assign(params, msg.data);
                    updateActiveNodes();
                } else if (msg.type === 'PLAY') {
                   // Ensure context is running (user interaction req usually, but WebView bypasses this often via media playback settings)
                   if (ctx.state === 'suspended') ctx.resume();
                   startSynth();
                } else if (msg.type === 'STOP') {
                   stopSynth();
                }
            }

            function updateActiveNodes() {
                if (!isPlaying) return;
                
                // Ramp times to prevent clicks
                const t = ctx.currentTime;
                const ramp = 0.01;

                if (outputGain) outputGain.gain.setTargetAtTime(params.volume, t, ramp);
                
                if (nodes.mainOsc) {
                    nodes.mainOsc.frequency.setTargetAtTime(params.pitch, t, ramp);
                    if (nodes.mainOsc.type !== params.waveform) nodes.mainOsc.type = params.waveform;
                }
                
                if (nodes.modOsc) {
                    nodes.modOsc.frequency.setTargetAtTime(params.modSpeed, t, ramp);
                    if (nodes.modOsc.type !== params.modWaveform) nodes.modOsc.type = params.modWaveform;
                }

                if (nodes.modGain) {
                    nodes.modGain.gain.setTargetAtTime(params.modDepth, t, ramp);
                }

                if (nodes.delay && Math.abs(nodes.delay.delayTime.value - params.delayTime) > 0.001) {
                    nodes.delay.delayTime.setTargetAtTime(params.delayTime, t, ramp);
                }

                if (nodes.feedback) nodes.feedback.gain.setTargetAtTime(params.delayFeedback, t, ramp);
                if (nodes.filter) nodes.filter.frequency.setTargetAtTime(params.delayCutoff, t, ramp);
            }

            function startSynth() {
                if (isPlaying) return;
                isPlaying = true;
                
                const t = ctx.currentTime;

                // 1. Oscillators
                const mainOsc = ctx.createOscillator();
                mainOsc.type = params.waveform;
                mainOsc.frequency.value = params.pitch;

                const modOsc = ctx.createOscillator();
                modOsc.type = params.modWaveform;
                modOsc.frequency.value = params.modSpeed;

                const modGain = ctx.createGain();
                modGain.gain.value = params.modDepth;

                // 2. Delay Chain
                const delay = ctx.createDelay(5.0);
                delay.delayTime.value = params.delayTime;

                const feedback = ctx.createGain();
                feedback.gain.value = params.delayFeedback;

                const filter = ctx.createBiquadFilter();
                filter.frequency.value = params.delayCutoff;

                // 3. Connect Graph
                // LFO -> Freq
                modOsc.connect(modGain);
                modGain.connect(mainOsc.frequency);

                // Signal -> Output
                mainOsc.connect(outputGain);

                // Echo Send
                mainOsc.connect(delay);
                delay.connect(filter);
                filter.connect(feedback);
                feedback.connect(delay);
                feedback.connect(outputGain);

                // 4. Start
                mainOsc.start(t);
                modOsc.start(t);

                // 5. Store Ref
                nodes = { mainOsc, modOsc, modGain, delay, feedback, filter };
                
                // Initial update to ensure params are synced
                updateActiveNodes();
            }

            function stopSynth() {
                if (!isPlaying) return;
                isPlaying = false;
                const t = ctx.currentTime;
                
                if (nodes.mainOsc) {
                    nodes.mainOsc.stop(t + 0.1);
                    nodes.mainOsc.disconnect();
                }
                if (nodes.modOsc) {
                    nodes.modOsc.stop(t + 0.1);
                    nodes.modOsc.disconnect();
                }
                // Clean up others if needed, though GC usually handles disconnected nodes
                nodes = {};
            }
        </script>
    </body>
    </html>
    `;

    return (
        <View style={{ height: 0, width: 0, overflow: 'hidden', position: 'absolute' }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                javaScriptEnabled={true}
            />
        </View>
    );
};
