import {DefaultTheme as NavigationLightTheme} from '@react-navigation/native';
const LightTheme = {
    ...NavigationLightTheme,
    colors: {
        ...NavigationLightTheme.colors,
        background: '#fff',
        text: '#000',
        primary: '#0055cc',
        secondary: '#555',
        actionSheet: '#fff',
    }
}

export default LightTheme;