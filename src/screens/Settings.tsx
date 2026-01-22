import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useAudio } from '../context/AudioContext';
import { colors } from '../theme';

const SettingsScreen = () => {
    const { isActive, setIsActive } = useAudio();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            <View style={styles.settingItem}>
                <Text style={styles.settingText}>Siren Active</Text>
                <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                    thumbColor={colors.surface}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingText: {
        fontSize: 16,
        color: colors.text,
    },
});

export { SettingsScreen as default };
