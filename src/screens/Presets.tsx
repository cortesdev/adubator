import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const PresetsScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Presets</Text>
            <View style={styles.presetList}>
                <Text style={styles.presetItem}>Dub Siren 1</Text>
                <Text style={styles.presetItem}>Dub Siren 2</Text>
                <Text style={styles.presetItem}>Dub Siren 3</Text>
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
    presetList: {
        flex: 1,
    },
    presetItem: {
        fontSize: 16,
        color: colors.text,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
});

export { PresetsScreen as default };
