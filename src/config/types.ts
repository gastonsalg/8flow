export type Profile = {
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultHeaders?: Record<string, string>;
};

export type ConfigStore = {
  activeProfile?: string;
  profiles: Profile[];
};
