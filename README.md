# What are we demonstrating? 
This is a reference visual demoing the Subtotals API availiable starting with the API 2.6 and announced/documented here: 
https://powerbi.microsoft.com/da-dk/blog/power-bi-developer-community-april-may-update/


# Note: use pbiviz 2.5 to build the visual

As of Nov 14, 2019 the most recent version of PBIVIZ is producing a malfunctioning visual when packaged with "pbiviz package". 

Unless fixed in the future PBIVIZ releases, I would suggest that you use the older PBIVIZ toolset of verions 2.5.0. 

To install it run: 

npm install -g powerbi-visuals-tools@2.5.0

# Known issue: subtotals not working in the debugger visual

As of Nov 17, 2019, subtotals are not working in the debugger visual. It’s a known issue and I am currently investigating the root cause. 

Please note the issue only affects the development process, while the release visuals (i.e., packaged PBIVIZ files) are working correctly in terms of the subtotals. 

Currently, the best (partial) workaround would be to disable the minimization of the visuals in development (--no-minify pbiviz flag) and debugging in F12. 
