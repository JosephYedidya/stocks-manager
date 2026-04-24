# StatsCards Fix TODO

## Plan Summary
Fix StatsCards display issues by:
1. Remove invalid CSS `composes` syntax
2. Fix data calculation inconsistencies (price matching)
3. Improve stats modal display
4. Add robust error handling/loading states

## Steps (in order):
- [x] Step 1: Fix StatsCards.css - remove `composes` line, apply `glass-card` class directly
- [x] Step 2: Update StatsCards.jsx - fix revenue/stock calcs, consistent price usage, better top product logic
- [x] Step 3: Enhance stats modal in AdminDashboard.jsx with Tables/lists per type
- [x] Step 4: Test in AdminDashboard - verify display, values correct
- [x] Step 5: Adjust dark mode styles/colors in AdminDashboard.css (remove HTML injection, improve dark theme)
- [x] Completion - all done

Current: Starting Step 1

