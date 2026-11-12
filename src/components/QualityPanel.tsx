import { QUALITY_CHOICES } from '../quality/store';
import { Scaffold } from './Scaffold';

/**
 * Rendering-quality control: native radios (free arrow-key behaviour and screen-reader semantics), styled as a segmented control.
 * Rendered twice (header popover, menu panel); both bind to one store in src/client/quality-ui.ts.
 */
export function QualityPanel({ prefix }: { prefix: 'pop' | 'menu' }) {
  return (
    <div className="quality-panel">
      <fieldset className="q-group">
        <legend>Rendering quality</legend>
        <div className="q-segments">
          {QUALITY_CHOICES.map((c) => (
            <label key={c} className="q-seg">
              <input type="radio" name={`quality-${prefix}`} value={c} defaultChecked={c === 'auto'} data-quality-radio />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="q-note">Auto picks for your device. This device currently shows the static version.</p>
      <label className="q-remember">
        <input type="checkbox" data-quality-remember />
        Remember on this device
      </label>
      <Scaffold id={`scaffold.quality.${prefix}`} what="the live 3D that these choices control" milestone="M2" />
    </div>
  );
}
