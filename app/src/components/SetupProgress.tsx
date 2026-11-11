// Barre d'étapes des questionnaires : trois traits et le nom de l'étape en cours
import { t } from '../i18n';

export function SetupProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="setup-progress">
      <div className="setup-progress-bars" aria-hidden="true">
        {labels.map((label, index) => <span key={label} data-done={index < step || undefined} />)}
      </div>
      <p>{t('Étape {n} sur {total}', { n: step, total: labels.length })} · <strong>{labels[step - 1]}</strong></p>
    </div>
  );
}
