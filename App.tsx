import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AudioProvider } from './src/context/AudioContext';
import { navigationTheme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
            <AudioProvider>
                <SafeAreaProvider>
                    <StatusBar style="dark" />
                    <NavigationContainer theme={navigationTheme}>
                        <AppNavigator />
                    </NavigationContainer>
                </SafeAreaProvider>
            </AudioProvider>
        </GestureHandlerRootView>
    );
};

export default App;
