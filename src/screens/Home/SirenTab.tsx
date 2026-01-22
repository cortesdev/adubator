import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, radius } from '../../theme';

type SirenTabProps = {
    onPitchChange: (value: number) => void;
};

export const SirenTab: React.FC<SirenTabProps> = ({ onPitchChange }) => {
    const [pitch, setPitch] = React.useState(400);
    const [modSpeed, setModSpeed] = React.useState(84);
    const [isActive, setIsActive] = React.useState(true);

    const handlePitchChange = (value: number) => {
        setPitch(value);
        onPitchChange(value);
    };

    return (
        <View style={styles.container}>
            <View style={styles.pitchContainer}>
                <Text style={styles.label}>PITCH</Text>
                <View style={styles.pitchSliderContainer}>
                    <View style={styles.pitchTrack}>
                        <View style={[styles.pitchFill, { height: `${100 - (pitch - 300) / 3}%` }]} />
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={300}
                        maximumValue={700}
                        step={1}
                        value={pitch}
                        onValueChange={handlePitchChange}
                        minimumTrackTintColor="transparent"
                        maximumTrackTintColor="transparent"
                        thumbTintColor={colors.primary}
                    />
                    <Text style={styles.pitchValue}>{pitch}Hz</Text>
                </View>
            </View>

            <View style={styles.modContainer}>
                <View style={styles.modSpeedContainer}>
                    <View style={styles.modSpeedHeader}>
                        <Text style={styles.label}>MOD SPEED</Text>
                        <Text style={styles.modSpeedValue}>{modSpeed}%</Text>
                    </View>
                    <Slider
                        style={styles.modSlider}
                        minimumValue={0}
                        maximumValue={100}
                        step={1}
                        value={modSpeed}
                        onValueChange={setModSpeed}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor="#404040"
                        thumbTintColor="#fff"
                    />
                </View>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
                        onPress={() => setIsActive(!isActive)}
                    >
                        <View style={[styles.toggleCircle, isActive && styles.toggleCircleActive]} />
                    </TouchableOpacity>
                    <Text style={styles.toggleLabel}>ACTIVE</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    pitchContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    label: {
        color: colors.textSecondary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    pitchSliderContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 200,
    },
    pitchTrack: {
        width: 60,
        height: '100%',
        backgroundColor: '#1E1E1E',
        borderRadius: radius.md,
        overflow: 'hidden',
        marginRight: spacing.lg,
        justifyContent: 'flex-end',
    },
    pitchFill: {
        width: '100%',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
    },
    slider: {
        flex: 1,
        height: '100%',
        transform: [{ rotate: '270deg' }],
    },
    pitchValue: {
        position: 'absolute',
        bottom: 0,
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: spacing.sm,
    },
    modContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
    },
    modSpeedContainer: {
        flex: 1,
    },
    modSpeedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    modSpeedValue: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    modSlider: {
        width: '100%',
        height: 4,
    },
    toggleContainer: {
        alignItems: 'center',
        marginLeft: spacing.lg,
    },
    toggleButton: {
        width: 50,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#404040',
        padding: 2,
        justifyContent: 'center',
    },
    toggleButtonActive: {
        backgroundColor: colors.primary,
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
    },
    toggleCircleActive: {
        alignSelf: 'flex-end',
    },
    toggleLabel: {
        color: colors.textSecondary,
        fontSize: 10,
        marginTop: 4,
        textTransform: 'uppercase',
    },
});

export default SirenTab;
