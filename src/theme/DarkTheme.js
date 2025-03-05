import {DarkTheme as NavigationDarkTheme} from '@react-navigation/native';
const DarkTheme = {
    ...NavigationDarkTheme,
    colors: {
        ...NavigationDarkTheme.colors,
        background: '#000',
        text: '#fff',
    }
}

export default DarkTheme;