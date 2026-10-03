/* eslint-env jest */
describe('config', () => {
  const original = process.env.REACT_APP_API_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.REACT_APP_API_URL;
    } else {
      process.env.REACT_APP_API_URL = original;
    }
    jest.resetModules();
  });

  it('points at the hosted API by default', () => {
    delete process.env.REACT_APP_API_URL;

    // eslint-disable-next-line global-require
    const { API_URL } = require('./config');

    expect(API_URL).toBe('https://mycontacts-api-juba.onrender.com');
  });

  it('can be pointed at another API at build time, without a trailing slash', () => {
    process.env.REACT_APP_API_URL = 'https://other.example/';

    // eslint-disable-next-line global-require
    const { API_URL } = require('./config');

    expect(API_URL).toBe('https://other.example');
  });

  it('gives both services the one address', () => {
    delete process.env.REACT_APP_API_URL;

    // eslint-disable-next-line global-require
    const { API_URL } = require('./config');
    // eslint-disable-next-line global-require
    const ContactsService = require('./services/ContactsService').default;
    // eslint-disable-next-line global-require
    const CategoriesService = require('./services/CategoriesService').default;

    expect(ContactsService.httpClient.baseURL).toBe(API_URL);
    expect(CategoriesService.httpClient.baseURL).toBe(API_URL);
  });
});
