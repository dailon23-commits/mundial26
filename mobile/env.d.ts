declare const process: {
  env: {
    EXPO_PUBLIC_WORLD_CUP_DATA_URL?: string;
  };
};

declare module '*.json' {
  const value: unknown;
  export default value;
}
