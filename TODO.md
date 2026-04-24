# SalesHistory Fix TODO

## Plan Summary
Fix SalesHistory table showing N/A / 0 FCFA / Standard by:
1. Enrich sales data using the `products` prop in SalesHistory.jsx
2. Preserve local product details when syncing with server in offlineClient.js

## Steps (in order):
- [x] Step 1: Fix SalesHistory.jsx - lookup product details from `products` prop, fix enrichment logic, add products to useEffect deps
- [x] Step 2: Fix offlineClient.js - preserve productName/productPrice/variantType when merging server response in recordSaleOffline and getSalesOffline
- [x] Step 3: Revise - added robust product ID normalization (`product` vs `productId`, populated objects), useCallback for loadSales, column renderer fallbacks
- [x] Step 4: Complete - both files edited with comprehensive normalization

