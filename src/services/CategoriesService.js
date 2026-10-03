import CategoryMapper from './mappers/CategoryMapper';
import { API_URL } from '../config';
import HttpClient from './utils/HttpClient';

class CaterogiesService {
  constructor() {
    this.httpClient = new HttpClient(API_URL);
  }

  async listCategories(signal) {
    const categories = await this.httpClient.get('/categories', { signal });

    return categories.map(CategoryMapper.toDomain);
  }
}

export default new CaterogiesService();
