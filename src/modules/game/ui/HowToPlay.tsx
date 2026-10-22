export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <div className="box-body">
      <h2>How to play</h2>
      <ol className="steps">
        <li><b>Click a shelf</b> to pick it up. Purple lines show the products people often buy together.</li>
        <li><b>Point at another shelf</b> to see how many points the swap would earn, then click to swap.</li>
        <li><b>Use your 10 swaps</b> to make Pip walk less. Every metre saved is a point.</li>
      </ol>
      <ul className="facts">
        <li>Shelves near the blue packing desk are the quickest to reach.</li>
        <li>Products bought together like to be neighbours.</li>
        <li>The two shelves facing each other across an aisle are the same spot for Pip, so swapping them does nothing.</li>
        <li>Stars: 1 for any saving, 2 for 1,000 points, 3 for 2,500 points.</li>
      </ul>
      <button className="primary" onClick={onBack}>Got it</button>
    </div>
  );
}
