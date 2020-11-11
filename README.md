# Abstract
This is a reference visual demoing the Subtotals API availiable starting with the API 2.6 and announced/documented here: 
https://powerbi.microsoft.com/da-dk/blog/power-bi-developer-community-april-may-update/


# Note: use pbiviz 3.1.15 or above to build the visual

To install it run: 

npm install -g powerbi-visuals-tools

# Known issue: subtotals not working in the debugger visual

As of Nov 17, 2019, subtotals are not working in the debugger visual. It’s a known issue and I am currently investigating the root cause. 

Please note the issue only affects the development process, while the release visuals (i.e., packaged PBIVIZ files) are working correctly in terms of the subtotals. 

Currently, the best (partial) workaround would be to disable the minimization of the visuals in development (--no-minify pbiviz flag) and debugging in F12. 
