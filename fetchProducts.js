import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import 'dotenv/config';

const prisma = new PrismaClient();

const { SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN } = process.env;
const graphqlEndpoint = `https://${SHOPIFY_STORE_URL}/admin/api/2025-01/graphql.json`;

let cursor = null, hasNextPage = true;

while (hasNextPage) {
    console.log("entered while loop")

    const query = `
  query {
    products(first: 250, after: ${cursor ? `"${cursor}"` : null}) {
      edges {
        node {
          id
          title
          handle
          description
          variants(first: 100) {
            edges {
              node {
                id
                title
                displayName
              }
            }
            pageInfo{
              hasNextPage
              endCursor
              startCursor
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }`;

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
        console.log(JSON.stringify(data, null, 2));

        const len = data.data.products.edges.length
        for(let i =0; i < len; i++)
        {
            const productNode = data.data.products.edges[i]?.node;
            if (!productNode) break;

            const {id: shopifyId, title, handle, description} = productNode;
            const variantsArr = productNode.variants.edges;
            console.log(variantsArr.length)
            let variants = ""
            for (let j = 0; j < variantsArr.length - 1; j++) {
                const variant = variantsArr[j].node;
                variants += JSON.stringify(variant) + ",";
            }
            variants += JSON.stringify(variantsArr[variantsArr.length - 1]);
            console.log(variants);
            await prisma.productOfShopify.create({
                data: {
                    shopifyId,
                    title,
                    handle,
                    description,
                    variants,
                },
            });

            console.log(`Product inserted: ${title}`);
        }

        hasNextPage = data.data.products.pageInfo.hasNextPage;
        cursor = data.data.products.pageInfo.endCursor;
    } catch (error) {
        console.error("Error fetching data or inserting into database:", error);
        break;
    }
}

await prisma.$disconnect();
