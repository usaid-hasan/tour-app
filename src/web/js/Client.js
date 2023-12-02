export default class Client {
  constructor(url) {
    this.url = url;
  }

  async send({ path, method, type = 'json', formData = null }) {
    const url = this.url + path;
    const options = { method };

    if (type === 'json') options.headers = new Headers({ 'Content-Type': 'application/json' });
    if (formData) options.body = type === 'json' ? JSON.stringify(Object.fromEntries(formData)) : formData;

    return await fetch(url, options);
  }
}
