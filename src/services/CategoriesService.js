import CategoryMapper from './mappers/CategoryMapper';
import HttpClient from './utils/HttpClient';

class CaterogiesService {
  constructor() {
    this.httpClient = new HttpClient('https://mycontacts-api-juba.onrender.com');
  }

  async listCategories(signal) {
    const categories = await this.httpClient.get('/categories', { signal });

    return categories.map(CategoryMapper.toDomain);
  }
}

export default new CaterogiesService();
