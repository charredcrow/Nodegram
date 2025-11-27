// Local configuration (without backend)
interface Config {
  disableInspect: boolean;
}

const config: Config = {
  disableInspect: false, // Disable DevTools (change to true for production)
};

export default config;
