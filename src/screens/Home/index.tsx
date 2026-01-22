import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../../theme';
import { useAudio } from '../../context/AudioContext';
import { SirenTab } from './SirenTab';

type TabType = 'SIREN' | 'LFO' | 'ECHO';

export const HomeScreen = () => {
    const [activeTab, setActiveTab] = useState<TabType>('SIREN');
    const navigation = useNavigation();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Audio context
    const {
        isPlaying,
        playSiren,
        stopSiren,
        setPitch,
        setModSpeed,
        setIsActive,
        pitch,
        modSpeed,
        isActive
    } = useAudio();

    // Animation for the DUB button
    useEffect(() => {
        if (isPlaying) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isPlaying]);

    const togglePlayback = async () => {
        if (isPlaying) {
            await stopSiren();
        } else {
            await playSiren();
        }
    };

    // Equalizer animation
    const renderEqualizer = () => {
        const bars = [];
        for (let i = 0; i < 8; i++) {
            const height = isPlaying ? 8 + Math.random() * 16 : 4;
            bars.push(
                <View
                    key={i}
                    style={[
                        styles.equalizerBar,
                        {
                            height,
                            backgroundColor: isPlaying ? colors.primary : colors.textSecondary,
                        }
                    ]}
                />
            );
        }
        return bars;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>aDUBator</Text>
                    <Text style={styles.subtitle}>JAMAICA SOUND</Text>
                </View>

                <View style={styles.headerRight}>
                    <Text style={styles.bpmText}>+12 BPM</Text>
                    <View style={styles.equalizer}>
                        {renderEqualizer()}
                    </View>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Text style={styles.icon}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                {(['SIREN', 'LFO', 'ECHO'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab && styles.activeTab,
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab && styles.activeTabText,
                            ]}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
                <SirenTab onPitchChange={setPitch} />
            </View>

            {/* DUB Button */}
            <View style={styles.footer}>
                {isPlaying && (
                    <Animated.View
                        style={[
                            styles.dubButtonPulse,
                            { transform: [{ scale: pulseAnim }] }
                        ]}
                    />
                )}
                <TouchableOpacity
                    style={styles.dubButton}
                    onPress={togglePlayback}
                    activeOpacity={0.9}
                >
                    <View style={[
                        styles.dubButtonInner,
                        isPlaying && styles.dubButtonActive,
                    ]}>
                        <Text style={styles.dubButtonText}>
                            {isPlaying ? 'STOP' : 'DUB'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: StatusBar.currentHeight || spacing.lg,
        paddingBottom: spacing.md,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        ...typography.h1,
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 24,
        lineHeight: 28,
    },
    subtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: -2,
    },
    bpmText: {
        ...typography.body,
        color: colors.text,
        fontSize: 12,
        fontWeight: '600',
        marginRight: spacing.md,
    },
    equalizer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 16,
        marginRight: spacing.md,
        gap: 2,
    },
    equalizerBar: {
        width: 2,
        backgroundColor: colors.textSecondary,
        borderRadius: 1,
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: radius.round,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    icon: {
        fontSize: 16,
        color: colors.text,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 2,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: colors.background,
    },
    tabText: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    activeTabText: {
        color: colors.primary,
        fontWeight: '700',
    },
    tabContent: {
        flex: 1,
        marginBottom: spacing.xl,
    },
    footer: {
        alignItems: 'center',
        paddingBottom: spacing.xl,
        position: 'relative',
    },
    dubButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    dubButtonPulse: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        zIndex: 1,
    },
    dubButtonInner: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dubButtonActive: {
        backgroundColor: colors.primary,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    dubButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default HomeScreen;
