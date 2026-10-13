import I18n from 'react-native-i18n';
import en from './en';
import zh from './zh';
import tw from './tw';
import kor from './kor';
import jap from './jap';
import melayu from './melayu';

I18n.defaultLocale = 'en';
I18n.fallbacks = true;
I18n.translations = {
    en,
    zh,
    tw,
    kor,
    jap,
    melayu
};

export default I18n;
