declare module "react-native-stars" {
  import { Component } from "react";
  import { ViewStyle } from "react-native";

  interface StarsProps {
    display?: number;
    count?: number;
    spacing?: number;
    starSize?: number;
    fullStar?: React.ReactNode;
    emptyStar?: React.ReactNode;
    halfStar?: React.ReactNode;
    containerStyle?: ViewStyle;
  }

  export default class Stars extends Component<StarsProps> {}
}