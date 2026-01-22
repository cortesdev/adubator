import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from './types';
import HomeScreen from '../screens/Home';
import SettingsScreen from '../screens/Settings';
import PresetsScreen from '../screens/Presets';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                tabBarIcon: ({ color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'musical-notes';

                    if (route.name === 'Siren') {
                        iconName = 'alert-circle';
                    } else if (route.name === 'LFO') {
                        iconName = 'pulse';
                    } else if (route.name === 'Echo') {
                        iconName = 'repeat';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Siren"
                component={HomeScreen}
                options={{ title: 'SIREN' }}
            />
            <Tab.Screen
                name="LFO"
                component={HomeScreen}
                options={{ title: 'LFO' }}
            />
            <Tab.Screen
                name="Echo"
                component={HomeScreen}
                options={{ title: 'ECHO' }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Settings' }}
            />
            <Stack.Screen
                name="Presets"
                component={PresetsScreen}
                options={{ title: 'Presets' }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;
