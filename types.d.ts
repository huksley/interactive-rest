type VerboseConsole = Console & {
    verbose: (str: string, ...any: unknown[]) => void;
  };
  