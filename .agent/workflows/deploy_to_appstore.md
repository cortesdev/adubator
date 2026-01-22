---
description: Deploy Expo App to App Store using EAS
---

# Deploy to App Store

This workflow helps you build and submit your Expo app to the Apple App Store using EAS (Expo Application Services).

## Prerequisites

1.  **Apple Developer Account**: You must have a paid Apple Developer account.
2.  **Expo Account**: You need an Expo account.

## Steps

1.  **Install EAS CLI**
    If you haven't already, install the EAS CLI global tool:
    ```bash
    npm install -g eas-cli
    ```

2.  **Login to Expo**
    Log in to your Expo account via the terminal:
    ```bash
    eas login
    ```

3.  **Configure Project for EAS**
    Initialize the project configuration. This creates an `eas.json` file.
    ```bash
    eas build:configure
    ```
    - When asked "Which platforms would you like to configure?", select **All** or **iOS**.

4.  **Build for App Store**
    Start the build process on Expo's servers. This handles certificates and signing automatically if you let it.
    ```bash
    eas build --platform ios
    ```
    - You will be asked to log in to your Apple Developer account during this process.
    - Expo will generate the necessary certificates and provisioning profiles.

5.  **Submit to App Store Connect**
    Once the build is complete, you can submit it directly to App Store Connect:
    ```bash
    eas submit -p ios
    ```
    - Select the build you just created from the list.

## Notes
- To test on a real device before the store, you can run `eas build --profile development --platform ios` to create a development build.
