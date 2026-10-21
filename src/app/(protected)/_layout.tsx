import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ProtectedLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}
