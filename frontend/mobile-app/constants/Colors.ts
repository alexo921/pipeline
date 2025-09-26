/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Pipeline brand palette (exact match with web dashboard)
const pipelineBlue = '#2466D0'; // primary blue from web
const pipelineTeal = '#2CB3BF'; // secondary teal from web
const pipelineDark = '#01253F'; // dark text from web
const pipelineLight = '#FFFFFF';
const pipelineGray = '#4A4A4A'; // secondary text from web
const pipelineBg = '#F4F4F4'; // background from web

const tintColorLight = pipelineBlue;
const tintColorDark = pipelineBlue;

export const Colors = {
  light: {
    text: pipelineDark,
    background: pipelineBg, // match web background
    tint: tintColorLight,
    icon: pipelineGray,
    tabIconDefault: pipelineGray,
    tabIconSelected: tintColorLight,
    // Web dashboard exact colors
    primary: pipelineBlue,
    secondary: pipelineTeal,
    card: pipelineLight,
    border: '#E5E5E5',
    mutedText: pipelineGray,
    accent: pipelineTeal,
    // Gradients matching web
    gradientPrimaryStart: pipelineBlue,
    gradientPrimaryEnd: pipelineTeal,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: pipelineBlue,
    secondary: pipelineTeal,
    card: '#1E1F21',
    border: '#2A2C2E',
    mutedText: '#9BA1A6',
    accent: pipelineTeal,
    gradientPrimaryStart: pipelineBlue,
    gradientPrimaryEnd: pipelineTeal,
  },
};
