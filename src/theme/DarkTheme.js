import {DarkTheme as NavigationDarkTheme} from '@react-navigation/native';
const DarkTheme = {
    ...NavigationDarkTheme,
    colors: {
        ...NavigationDarkTheme.colors,
        background: '#000',
        text: '#fff',
        primary: '#0055cc',
        secondary: '#1e1e1e',
        actionSheet: '#fff',
        bottomSheet: '#1e1e1e'
    }
}

export default DarkTheme;