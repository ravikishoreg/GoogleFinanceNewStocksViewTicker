<pre>
Need to open new Google Finance "Your Stocks" view. After page loads, click on bookmarklet

Save a bookmarklet with below text which will download gf.js file and render a stock ticker 

javascript:(function () {
    window.NUM_ROWS = 30;
    window.ENFORCE_ORDER_STR = "NIFTY SBIN GOOGL";
    document.getElementsByTagName('head')[0].appendChild(document.createElement('script')).src = 'https://rawgit.com/ravikishoreg/GoogleFinanceNewStocksViewTicker/master/gf.js?' + Math.random();
})();

You can also configure few properties. Check gf.js "Variables that can be configured in the bookmaklet"

Advantages of using the bookmarklet this way rather than putting gf.js directly in the bookmarklet is that any corrections made will automatically apply.

Working as of April 7th, 2018
</pre>

Default View:
![Default View](/defaultView.png)

Changes to 
![New View](/postBookmarkletView.PNG)
