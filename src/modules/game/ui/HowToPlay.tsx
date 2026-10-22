import { RULES } from '../../../core/engine/rules';

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <div className="box-body">
      <h2>How to play</h2>
      <ol className="steps">
        <li><b>Select a shelf.</b> Dashed lines show the products most often ordered with it.</li>
        <li><b>Hover another shelf</b> to preview the time the swap saves or costs, then click to swap.</li>
        <li><b>Spend 10 swaps.</b> Your score is the seconds saved across every order in the test week.</li>
      </ol>
      <ul className="facts">
        <li>Shelves near the packing dock are the quickest to walk to.</li>
        <li>Products ordered together save walking when they sit side by side.</li>
        <li>Forklift items (FL {RULES.forkliftFrom} and up) are quicker at the ends of an aisle: the forklift drives in less.</li>
        <li>Shelves facing each other across an aisle share a pick point, so swapping them changes nothing.</li>
        <li>Rating: Bronze for any saving, Silver at 1,500, Gold at 4,000.</li>
      </ul>
      <button className="primary" onClick={onBack}>Back</button>
    </div>
  );
}
