import { StyleSheet } from "react-native";

export const OTP_LENGTH = 6;

const otpStyles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  pinCodeContainer: {
    backgroundColor: "#9CA3AF",
    borderColor: "#9CA3AF",
    borderWidth: 1,
    borderRadius: 6,
    width: 45,
    height: 45,
    color: "#0F1115",
    fontSize: 16,
    textAlign: "center",
  },
  pinCodeText: {
    color: "#0F1115",
    fontSize: 18,
    fontWeight: "bold",
  },
  focusStick: {
    backgroundColor: "#9A2121",
  },
  activePinCodeContainer: {
    borderColor: "#9A2121",
    borderWidth: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  filledPinCodeContainer: {
    backgroundColor: "#9CA3AF",
    borderColor: "#9CA3AF",
  },
  disabledPinCodeContainer: {
    backgroundColor: "#9CA3AF",
  },
});

export const otpInputTheme = {
  containerStyle: otpStyles.container,
  pinCodeContainerStyle: otpStyles.pinCodeContainer,
  pinCodeTextStyle: otpStyles.pinCodeText,
  focusStickStyle: otpStyles.focusStick,
  focusedPinCodeContainerStyle: otpStyles.activePinCodeContainer,
  placeholderTextStyle: otpStyles.placeholderText,
  filledPinCodeContainerStyle: otpStyles.filledPinCodeContainer,
  disabledPinCodeContainerStyle: otpStyles.disabledPinCodeContainer,
};
