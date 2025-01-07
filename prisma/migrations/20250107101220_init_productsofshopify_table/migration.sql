-- CreateTable
CREATE TABLE "ProductOfShopify" (
    "id" SERIAL NOT NULL,
    "shopify_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "description" TEXT,

    CONSTRAINT "ProductOfShopify_pkey" PRIMARY KEY ("id")
);
