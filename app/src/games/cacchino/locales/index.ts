import type { Dict, Lang } from '../../../core/i18n';
import it from './it.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';
import pt from './pt.json';

export const LOCALES: Record<Lang, Dict> = { it, en, es, fr, de, pt };
