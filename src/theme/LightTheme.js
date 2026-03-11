import {DefaultTheme as NavigationLightTheme} from '@react-navigation/native';
const LightTheme = {
    ...NavigationLightTheme,
    colors: {
        ...NavigationLightTheme.colors,
        background: '#fff',
        text: '#284758',
        primary: '#284758',
        secondary: '#284758',
        actionSheet: '#fff',
        bottomSheet: 'rgb(18, 18, 18)',
        browserBottomSheet: '#284758',
        browserBottomSheetPan: '#fff',
    }
}

export default LightTheme;