const DEFAULT_API_URL = 'https://mycontacts-api-juba.onrender.com';

/**
 * Address of the API. Set REACT_APP_API_URL when building to point at another one; it is read at
 * build time. Never ends with a slash, so paths can be appended as "/contacts".
 */
export const API_URL = (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

export default { API_URL };
