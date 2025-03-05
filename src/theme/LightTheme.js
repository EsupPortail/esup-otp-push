import {DefaultTheme as NavigationLightTheme} from '@react-navigation/native';
const LightTheme = {
    ...NavigationLightTheme,
    colors: {
        ...NavigationLightTheme.colors,
        background: '#fff',
        text: '#000',
    }
}

export default LightTheme;