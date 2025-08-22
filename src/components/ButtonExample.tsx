import Button from './ui/Button';

function ButtonExample() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Button Variants Example</h3>

      <div className="flex gap-4">
        <Button variant="primary">Primary Button</Button>

        <Button variant="secondary">Secondary Button</Button>

        <Button variant="primary" disabled>
          Disabled Primary
        </Button>

        <Button variant="secondary" disabled>
          Disabled Secondary
        </Button>
      </div>

      <div className="text-sm text-gray-600">
        <strong>Usage:</strong>
        <br />
        <code>&lt;Button variant="primary"&gt;Primary&lt;/Button&gt;</code>
        <br />
        <code>&lt;Button variant="secondary"&gt;Secondary&lt;/Button&gt;</code>
      </div>
    </div>
  );
}

export default ButtonExample;
