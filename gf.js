//Variables that can be configured in the bookmaklet
var ENFORCE_ORDER_STR = ENFORCE_ORDER_STR || "NIFTY SBIN";  //These will come at the start
var NUM_ROWS = NUM_ROWS || 30;          //Number of stocks in a row
var EXCHANGES_TO_OMIT = ['NSE', 'NASDAQ'];
var HIDE_BODY = true;   
var EXPAND_LIST = true; //Automatically expand "Your Stock" by clicking on arrow.

var ENFORCE_ORDER = ENFORCE_ORDER_STR.split(/\s+/);
function gfInit()
{
  console.log("gfInit");
  
  //////////////////////////////DOMUTILS - BEGIN/////////////////////////////////////////////
  var DOMUtils = function(){}
  DOMUtils.create$Div = function(id, classList, text, style, title)
  {
    if(!style) style ='';
    var idText = 'id="' + id + '"';
    var $el = $('<div style="'+style+'"></div>');
    if(id) $el.attr('id', id);
    if(classList) $el.addClass(classList);
    if(text) $el.text(text);   
    if(title) $el.attr('title', title);
    return $el;
  }
  DOMUtils.getDomText = function(elNode)
  {
    return $(elNode).text();
  }
  DOMUtils.get$Text = function($elNode)
  {
    return $elNode.text();
  }
  DOMUtils.get$Color = function($elNode)
  {
    return $elNode.css('color');
  }
  window.DOMUtils = DOMUtils;
  //////////////////////////////DOMUTILS - END/////////////////////////////////////////////

  if(!window.jQuery)
  {
    var jq = document.createElement("script");
    jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js";
    jq.async = false; 
    jq.onload = function() {
      console.log("jquery loaded");
      prepareChart();
    };
    document.body.appendChild(jq);
  }
  else
  {
    console.log("jquery already loaded");
    prepareChart();
  }

  function prepareChart()
  {
    window.$ = window.jQuery;
    $ = window.jQuery;  //without this for some reason, $ is not jQuery
    console.log("prepareChart", window.jQuery, $);
    expandAllStockList();
  }
  
  //Expand the stock list
  function expandAllStockList(numTimes)
  {
    numTimes = numTimes || 1;
    console.log("expandAllStockList", numTimes);
    var $next = window.EXPAND_LIST ? $("#knowledge-finance-wholepage__financial-entities-list").siblings([role="button"]) : null;
    if(numTimes < 30 && $next && $next.length == 1 && $next.css('display') != 'none')
    {
      $next.click()
      setTimeout(expandAllStockList, 300, numTimes+1);
    }
    else
    {
      doPostExpansion();
    }
  }

  function doPostExpansion()
  {
    console.log("doPostExpansion");
    injectNeededStyles();
    var stocks = collectData();
    var sortedStocks = sortStocks(stocks);
    renderStocks(sortedStocks);
  }
  
  function injectNeededStyles()
  {
    console.log("injectNeededStyles",$);
    $("<style>")
      .prop("type", "text/css")
      .html("\
        .gf-rows {\
          display: table;\
          width: 200px;\
          font-size: 15px;\
          font-family: Calibri,Arial;\
          float: left;\
          padding-left: 10px;\
          border-right: 1px dotted grey;\
          padding-right: 10px;\
          min-width: 250px;\
        }\
        .gf-row {\
         display: table-row;\
        }\
        .gf-cell {\
          display: table-cell;\
          padding-left: 12px;\
        }\
        .gf-canvas {\
          width: 100%;\
          height: 100%;\
          position: absolute;\
          left: 0px;\
          top: 0px;\
          z-index: 1000;\
          background-color: white;\
          padding-top: 10px;\
        }\
        .gf-symbol {\
          width: 100px;\
        }\
        .gf-price {\
        }\
        .gf-change {\
        }\
        .gf-percentChange {\
        }\
")
      .appendTo("head");
  }
  function renderStocks(stocks)
  {
    console.log("renderStocks");
    $(".gf-canvas").remove();
    var $canvas = DOMUtils.create$Div(null, "gf-canvas");
    
    var size = NUM_ROWS;
    for (var jj=0; jj<stocks.length; jj+=size) 
    {
      var oneSetStocks = stocks.slice(jj,jj+size);
    
      var $rows = DOMUtils.create$Div(null, "gf-rows");
      for(var ii=0; ii < oneSetStocks.length; ++ii)
      {
        var stock = oneSetStocks[ii];
        var stockCode = stock.stockCode;
        $rows.append(
          DOMUtils.create$Div(null, "gf-row")
          .append(DOMUtils.create$Div(null, "gf-cell gf-symbol", stockCode, null, stock.symbol))  
          .append(DOMUtils.create$Div(stockCode+"PRICE", "gf-cell gf-price", stock.getLastPrice()))  
          .append(DOMUtils.create$Div(stockCode+"CHANGE", "gf-cell gf-change", stock.getChange()))  
          .append(DOMUtils.create$Div(stockCode+"PERCENT", "gf-cell gf-percentChange", stock.getPercentChange()))
        );
      }
      $canvas.append($rows);

    }
    //$('#search').prepend($rows);
    $('body').prepend($canvas);
    if(window.HIDE_BODY)
      $('body').css('overflow', 'hidden');
    
    $(window).scrollTop(0);
  }
  function renderChange(stock, changeType, value, color)
  {
    var stockCode = stock.stockCode;
//     console.log("renderChange ", stockCode, changeType, value, color);
    $el = $('#' + stockCode + changeType);
//     console.log($el);
    $el.text(value);
    if(color)
      $el.css('color', color);
  }

  ///////////////////////////////////STOCK CLASS - BEGIN///////////////////////////////////////////
  function Stock(symbol, lastPriceEl, stockCode, currency, timeEl, changeEl, percentChangeEl)
  {
    this.symbol = symbol;    
    this.stockCode = stockCode.replace(/( |:|-)/g, '').trim();
    for(var ii=0; ii < EXCHANGES_TO_OMIT.length; ++ii)
    {
      this.stockCode = this.stockCode.replace(EXCHANGES_TO_OMIT[ii], '');
    }
    console.log(this.stockCode);
    this.currency = currency;

    this.lastPriceEl = lastPriceEl;
    //this.timeEl = timeEl;
    this.changeEl = changeEl;
    this.percentChangeEl = percentChangeEl;

    this.addObservers();
  }

  Stock.prototype.addObservers = function()
  {
    this._mutationObserver = new MutationObserver(this.nodeChanged);
    this._mutationObserver.observe(this.lastPriceEl, {childList: true});
    //this._mutationObserver.observe(this.timeEl, {childList: true});
    this._mutationObserver.observe(this.changeEl, {childList: true});
    this._mutationObserver.observe(this.percentChangeEl, {childList: true});
    
    this._mutationObserver._holder = this;
  }

  Stock.prototype.nodeChanged = function(mutationsList, mutationObserver)
  {
    var that = mutationObserver._holder;
    for(var mutation of mutationsList) 
    {
      if (mutation.type == 'childList') 
      {
        var $target = $(mutation.target);
        if(mutation.target == that.lastPriceEl)
        {
          renderChange(that, "PRICE", DOMUtils.get$Text($target));
        }
        //else if (mutation.target == that.timeEl)
        //{
          //that.time = DOMUtils.get$Text($target);
        //}
        else if (mutation.target == that.changeEl)
        {
          renderChange(that, "CHANGE", DOMUtils.get$Text($target), DOMUtils.get$Color($target));
        }
        else if (mutation.target == that.percentChangeEl)
        {
          renderChange(that, "PERCENT", DOMUtils.get$Text($target), DOMUtils.get$Color($target));
        }
      }
    }
  }

  Stock.prototype.getLastPrice = function() { return DOMUtils.getDomText(this.lastPriceEl); }
  Stock.prototype.getTime = function() { return DOMUtils.getDomText(this.timeEl); }
  Stock.prototype.getChange = function() { return DOMUtils.getDomText(this.changeEl); }
  Stock.prototype.getPercentChange = function() { return DOMUtils.getDomText(this.percentChangeEl); }
  ///////////////////////////////////STOCK CLASS - END///////////////////////////////////////////

  //$($("#knowledge-finance-wholepage__financial-entities-list").children()[0]).find('span:not(:has(*))')
  //returns SYMBOL, LAST PRICE, CURRENCY, STOCK CODE, <State>, TIME, CHANGE, %CHANGE
  function collectData()
  {
    var stocks = [];
    var $topNodes = $("#knowledge-finance-wholepage__financial-entities-list").children();
    var count =0;
    for(var ii=0; ii < $topNodes.length; ++ii)
    {
      var $topNode = $($topNodes[ii]);
      var elList = $topNode.find('span:not(:has(*))');

      if(elList.length == 0)
        continue;
      
      //For NIFTY --> there is no currency. So length is 7 instead of default 8
      if(elList.length == 7)
      {
        elList.splice(2,0,'');
      }
      var symbol = DOMUtils.getDomText(elList[0]);
      var lastPriceEl = elList[1];
      var currency = DOMUtils.getDomText(elList[2]);
      var stockCode = DOMUtils.getDomText(elList[3]);
      var currentState = DOMUtils.getDomText(elList[4]); //Closed:
      var timeEl = elList[5];
      var changeEl = elList[6];
      var percentChangeEl = elList[7];
      stocks.push(new Stock(symbol, lastPriceEl, stockCode, currency, timeEl, changeEl, percentChangeEl));
    }
    //window.stocks = stocks;
//     console.log(stocks);
    return stocks;
  }
  
  function sortStocks(stocks)
  {
      //First collect all the stocks which are enforced in this order, then append the rest
      var enforcedStocks = {};
      var sortedStocks = [];
      for(var ii=0; ii < ENFORCE_ORDER.length; ++ii)
      {
        var currentStock = ENFORCE_ORDER[ii].toLowerCase();
        enforcedStocks[currentStock] = 1;
        for(var jj=0; jj < stocks.length; ++jj)
        {
          if(stocks[jj].stockCode.toLowerCase() == currentStock)
          {
            sortedStocks.push(stocks[jj]);
          }
        }
      }
    
      //Now push the un-enforced stocks in reverse order as latest stocks will be at the start
      for(var jj=stocks.length-1; jj >= 0 ; jj--)
      {
        if(enforcedStocks[stocks[jj].stockCode.toLowerCase()] == 1) //already pushed
          continue;
        sortedStocks.push(stocks[jj]);
      }
    
//       console.log(sortedStocks);
      return sortedStocks;
  }
};

gfInit();
