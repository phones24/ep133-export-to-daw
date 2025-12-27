interface AppStateDisplayProps {
  title: string;
  message: string | React.ReactNode;
}

function AppStateDisplay({ title, message }: AppStateDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-xl font-semibold">{title}</p>
      <p className="text-sm text-center">{message}</p>
    </div>
  );
}

export default AppStateDisplay;
