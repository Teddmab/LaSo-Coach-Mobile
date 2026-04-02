import { Linking } from 'react-native';
import api from '../api';

export type AppFeedbackCategory = 'bug' | 'suggestion' | 'payment' | 'usability' | 'other';

export type InAppFeedbackSentiment = 'okay' | 'not_great';

export interface AppFeedbackPayload {
  rating: number;
  comment?: string;
  category: AppFeedbackCategory;
  sentiment: InAppFeedbackSentiment;
  userEmail?: string;
  userId?: string;
}

const SUPPORT_EMAIL = 'support@lasocoach.com';

function buildMailBody(p: AppFeedbackPayload): string {
  return [
    '--- Retour application LaSo Coach ---',
    `Sentiment initial: ${p.sentiment}`,
    `Note: ${p.rating}/5`,
    `Catégorie: ${p.category}`,
    '',
    p.comment?.trim() ? `Commentaire:\n${p.comment.trim()}` : '(Pas de commentaire)',
    '',
    '---',
    `Utilisateur: ${p.userEmail ?? 'non renseigné'}`,
    `ID: ${p.userId ?? 'non renseigné'}`,
  ].join('\n');
}

/**
 * Envoie le feedback : tentative API silencieuse, puis repli mailto (comme ContactSupport).
 */
export async function submitAppFeedback(payload: AppFeedbackPayload): Promise<{ ok: boolean }> {
  try {
    await api.post('/app/in-app-feedback', {
      rating: payload.rating,
      comment: payload.comment?.trim() || undefined,
      category: payload.category,
      sentiment: payload.sentiment,
    });
    return { ok: true };
  } catch {
    // Backend optionnel : ne pas bloquer l’utilisateur
  }

  const subject = encodeURIComponent('Retour application LaSo Coach');
  const body = encodeURIComponent(buildMailBody(payload));
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  try {
    if (await Linking.canOpenURL(mailto)) {
      await Linking.openURL(mailto);
      return { ok: true };
    }
  } catch {
    // ignore
  }
  return { ok: false };
}
