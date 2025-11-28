import axios from 'axios';

export class ShopifyService {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.baseURL = `https://${shopDomain}/admin/api/2024-01`;
  }

  getHeaders() {
    return {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
    };
  }

  async getCustomers(limit = 250, pageInfo = null) {
    try {
      let url = `${this.baseURL}/customers.json?limit=${limit}`;

      if(pageInfo) {
        url += `&page_info=${pageInfo}`;
      }

      const response = await axios.get(url, { headers: this.getHeaders() });

      return {
        customers: response.data.customers || [],
        nextPageInfo: this.extractPageInfo(response.headers.link),
      };

    } catch (error) {
      console.error('Error fetching customers:', error.response?.data || error.message);
      throw error;
    }
  }

  async getOrders(limit = 250, pageInfo = null, sinceId = null) {
    try {
      let url = `${this.baseURL}/orders.json?limit=${limit}&status=any`;

      if(pageInfo) {
        url += `&page_info=${pageInfo}`;
      } else if (sinceId) {
        url += `&since_id=${sinceId}`;
      }

      const response = await axios.get(url, { headers: this.getHeaders() });

      return {
        orders: response.data.orders || [],
        nextPageInfo: this.extractPageInfo(response.headers.link),
      };

    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
      throw error;
    }
  }

  async getProducts(limit = 250, pageInfo = null) {
    try {
      let url = `${this.baseURL}/products.json?limit=${limit}`;

      if(pageInfo) {
        url += `&page_info=${pageInfo}`;
      }

      const response = await axios.get(url, { headers: this.getHeaders() });

      return {
        products: response.data.products || [],
        nextPageInfo: this.extractPageInfo(response.headers.link),
      };

    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw error;
    }
  }

  async getShopInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/shop.json`, {
        headers: this.getHeaders(),
      });

      return response.data.shop;

    } catch (error) {
      console.error('Error fetching shop info:', error.response?.data || error.message);
      throw error;
    }
  }

  extractPageInfo(linkHeader) {
    if(!linkHeader) return null;
    const links = linkHeader.split(',');

    const nextLink = links.find((link) => link.includes('rel="next"'));
    if(!nextLink) return null;

    const match = nextLink.match(/page_info=([^&>]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // Webhook verification
  verifyWebhook(data, hmacHeader) {
    if(!hmacHeader) return false;

    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET || '')
      .update(JSON.stringify(data))
      .digest('base64');
      
    return hash === hmacHeader;
  }
}

