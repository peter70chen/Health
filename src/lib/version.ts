import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;
export const APP_DISPLAY_VERSION = `v${APP_VERSION.replace(/\.0$/, '')}`;
