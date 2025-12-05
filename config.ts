export default {
  images: {
    limit: 5, // limit max stroage for images
  },
} as Config;

export interface Config {
  images: {
    limit: number;
  };
}
