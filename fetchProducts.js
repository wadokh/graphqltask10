import 'dotenv/config'
import fetch from 'node-fetch';
import sql from './db.js'

//require('dotenv').config();
const { SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN } = process.env;
// const fetch = require('node-fetch');

const graphqlEndpoint = `https://${SHOPIFY_STORE_URL}/admin/api/2025-01/graphql.json`;

let cursor = null, hasNextPage = true;
while(hasNextPage) {
    console.log("entered while loop")
    const query = `
query {
    products(first: 1, after: ${cursor ? `"${cursor}"`:null}) {
      edges {
        node {
          id
          title
          handle
          description
        }
      }
      pageInfo {
        hasNextPage
        endCursor
        startCursor
      }
    }
  },
`;
    console.log("query")

    try {
        const response = await fetch(graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();
        console.log("after fetching data");
        console.log(JSON.stringify(data, null, 2));

        const product = data.data.products.edges[0].node;
        console.log(product);

        await sql.query(
            `INSERT INTO products (shopify_id, title, handle, description) VALUES ($1, $2, $3, $4)`,
            [product.id, product.title, product.handle, product.description]
        );
        console.log("Product inserted into database");

        hasNextPage = data.data.products.pageInfo.hasNextPage;
        cursor = data.data.products.pageInfo.endCursor;
    } catch (error) {
        console.error("Error fetching data or inserting into database:", error);
        break;
    }
}
