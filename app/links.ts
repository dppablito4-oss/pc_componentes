/** Destinations that appear in more than one panel. */

/** The project's source, linked from the header byline and the About panel. */
export const REPOSITORY = 'https://github.com/Yoosseph/pc-anatomy';
export const GITHUB_PAGES = import.meta.env.VITE_GITHUB_PAGES === 'true';
export const EXPLORER = import.meta.env.BASE_URL;
/** The written companion to the explorer, served as a static page. */
export const GUIDE = EXPLORER + 'guide/';
/** The section of the guide that explains browser hardware acceleration. */
export const GUIDE_ACCELERATION = GUIDE + '#smoother-3d';
/** A new public issue: where the feedback form sends people when it is not
    set up on the deployment they are using. */
export const NEW_ISSUE =
  (GITHUB_PAGES ? 'https://github.com/dppablito4-oss/pc_componentes' : REPOSITORY) +
  '/issues/new';
/** The function behind the feedback form: `api/contact.ts`. */
export const CONTACT_ENDPOINT = EXPLORER + 'api/contact';
