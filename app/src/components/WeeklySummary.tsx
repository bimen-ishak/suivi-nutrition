import { locale, t } from '../i18n';

interface Metric {
  label: string;
  value: number | null;
  unit: string;
}

export function WeeklySummary({ count, metrics, note }: { count: number; metrics: Metric[]; note?: string }) {
  const format = new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 });
  return (
    <section className="weekly-summary">
      <div className="weekly-summary-heading">
        <h2>{t('7 derniers jours')}</h2>
        <span>{t('Jours comptés · {n}/7', { n: count })}</span>
      </div>
      <dl>
        {metrics.map(metric => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value === null ? '—' : <>{format.format(metric.value)} <small>{metric.unit}</small></>}</dd>
          </div>
        ))}
      </dl>
      {note && <p>{note}</p>}
    </section>
  );
}
