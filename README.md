<pre>
Need to open new Google Finance "Your Stocks" view
Save a bookmarklet with below text which will download this file and render a stock ticker 

javascript:(function () {
    var new_script = document.createElement("script"); 
    new_script.src = "https://rawgit.com/ravikishoreg/GoogleFinanceNewStocksViewTicker/master/gf.js"; 
    document.body.appendChild(new_script);
})();

You can also configure few properties. Check gf.js "Variables that can be configured in the bookmaklet"
Working as of April 7th, 2018
</pre>
