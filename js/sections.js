
/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function() {
  // constants to define the size
  // and margins of the vis area.
  var width = 800;
  var height = 640;
  var margin = {top:0, left:20, bottom:40, right:10};

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  // We will set the domain when the
  // data is processed.
  
  /* DECLARE TREEMAP */
  var treemap = d3.layout.treemap()
  .children(function(d, depth) { return depth ? null : d.children; })
  .padding(4)
  .size([width - 20, height])
  .sticky(true)
  .value(function (d) { return d.size; });

  /* SCALES FOR TOP 10 COMPANIES CHART */
  var circleScale = d3.scale.sqrt()
  .range([11, 60]);

  var countries = ["USA","China", "India", "UK", "Israel", "Germany", "Sweden", "S Korea", "Singapore", "Canada", "Argentina", "Netherlands", "Thailand", "France", "Scotland", "Czech Rep.", "Luxembourg"];

  var countryColor = d3.scale.ordinal()
  .domain(["USA", "China", "India"])
  .range(["#002868", "#cc0000","#FFA500"]);

  /* SCALES AND AXIS FOR INDUSTRIES CHART */

  var xIndScale = d3.scale.linear()
  .range([10, width - 50]);

  var yIndScale = d3.scale.ordinal()
  .rangeRoundBands([0, height - 50], 0.1, 0.1);

  var xIndAxis = d3.svg.axis()
  .scale(xIndScale)
  .orient("bottom");

  /* SCALES AND AXIS FOR FASTEST CHART */

  var xFastScale = d3.scale.linear()
  .range([10, width - 50]);

  var yIndScale = d3.scale.ordinal()
  .rangeRoundBands([0, height - 50], 0.1, 0.1);

  var xFastAxis = d3.svg.axis()
  .scale(xFastScale)
  .orient("bottom");


  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];
  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  var updateFunctions = [];

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function(selection) {

    selection.each(function(rawData) {
      // create svg and give it a width and height
      svg = d3.select(this)
      .selectAll("svg")
      .data([rawData]);
      
      svg.enter()
      .append("svg")
      .append("g");

      svg.attr("width","100%")
      .attr("height","100%")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
      .attr("preserveAspectRatio", "xMinYMin");

      // this group element will be used to contain all
      // other elements.
      g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      //Get top 10 most valued companies
      var top10Data = rawData.sort(function (a,b) {
        return b.valuation - a.valuation; })
      .slice(0, 10);

      var cir_padding = 150;

      // Give x and y coordinates to draw circles
      top10Data.forEach(function (d, i) { 
        d.cx = ((i % 3) * (width / 3)) + cir_padding;

        if (i < 3) {
          d.cy = height / 4 - 70;
        } else if (i < 6) {
          d.cy = 2 * height / 4 - 20;
        } else if (i < 9) {
          d.cy = 3 * height / 4 - 20;
        } else {
          d.cy = height - 40;
        }
      });

      // Set domain for circle chart
      var circleDomain = d3.extent(top10Data, function (d) {
        return +d.valuation;
      });

      // Set domain for circle chart
      circleScale.domain(circleDomain);

      // Set domains for bar chart
      var asiaList = ["India", "China", "Israel", "Singapore", "South Korea", "Thailand"];

      var asiaData = rawData.filter(function(d) {
        return asiaList.indexOf(d.country) > -1;
      });

      var asiaInd = getIndData(asiaData);

      var xIndMax = d3.max(asiaInd, function (d) {
        return d.values.length;
      });

      // Set domain for fast bar chart
      xFastScale.domain([0, 2.23]);
      //yFastScale.domain[]

      // Set domain for country bar chart
      xIndScale.domain([0, xIndMax]);
      yIndScale.domain(asiaInd.map(function (d) {
        return d.key;
      }));



      setupVis(asiaInd, top10Data, asiaData);
      setupSections();

    });
  };


  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   */
  setupVis = function(asiaInd, top10Data, indData) {
    // axis
    g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height - 45)  + ")")
      .call(xIndAxis);
    g.select(".x.axis").style("opacity", 0);

    g.select(".x.axis")
    .append("text")
    .attr("id", "x-label")
    .attr("x", width - 190)
    .attr("y", -20)
    .text("Number of companies");

    /*******
    /***** START OF INTRO TEXT
    ******/
    
    // Initial intro text
    g.append("text")
      .attr("class", "sub-title openvis-title")
      .attr("x", width / 2)
      .attr("y", (height / 3) + (height / 5) )
      .text("World's most valuable companies");

    g.selectAll(".openvis-title")
      .attr("opacity", 0);

    // Text showing number of unicorns
    g.append("text")
      .attr("class", "title count-title highlight")
      .attr("x", width / 2)
      .attr("y", height / 3)
      .text("150");

    g.append("text")
      .attr("class", "sub-title count-title")
      .attr("x", width / 2)
      .attr("y", (height / 3) + (height / 10) )
      .text("companies");

    g.append("text")
      .attr("class", "title value-title highlight")
      .attr("x", width / 2)
      .attr("y", height / 3)
      .text("$169.1 billion");

    g.append("text")
      .attr("class", "sub-title value-sub")
      .attr("x", width / 2)
      .attr("y", (height / 3) + (height / 10) )
      .text("in total value");

    g.selectAll(".count-title")
      .attr("opacity", 0);

    /*******
    /***** END OF INTRO TEXT
    ******/

  /*------------------------------------------------------------------*/

  /*******
  /***** START OF TREEMAP
  ******/

  // Color scale for cells
  var color = d3.scale.category20c();

  // Import data 
  d3.json("data/unicorns.json", function (error, json) {
    if (error) throw error;

    // Data join
    box = g.data([json]) // the layout expects a json array
    .selectAll(".tree")
    .data(treemap.nodes)
    .attr("transform", "translate(20,0)");

    box.enter()
    .append("g")
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; 
    });

    // Make the rectangles
    box.append("rect")
    .attr("class", "tree")
    .attr("id", function (d) { return d.name; })
    .style("fill", function(d, i) { 
      return color(d.name); })
    .style("opacity", function (d, i) {
      if (i === 0) {
        return 0;
      }
    })
    .attr("width", 0) // We will apply these when user scrolls to this chart 
    .attr("height", 0); 

    // Names of countries
    box.append("text")
    .attr("class", "tree-text")
    .attr("x", function(d, i) { // For smaller cells, we need to change x and y 
      if (i >= 11) {            // coordinates to fit the name inside the cell
        return 50;
      }
      return d.dx / 2; 
    })
    .attr("y", function(d, i) {
      if (i >= 11) {
        return -15;
      }
      return d.dy / 2; 
    })
    .attr("dy", ".35em")                // We also need to rotate the name
    .attr("transform", function (d, i) {
      if (i >= 11) {
        return "rotate(90)";
      }
    })
    .attr("text-anchor", "middle")
    .attr("opacity", 0)
    .attr("font-size", function (d, i) {
      if (i <= 4) { return "2em"; }
    })
    .text(function(d) { return d.name; });

    // Text to show number of companies in each country
    box.append("text")
    .attr("class", "tree-num")
    .attr("x", function (d, i) {
      if (i <= 4 ) {
        return d.dx / 2;
      }
    })
    .attr("y", function (d, i) {
      if (i <= 4 ) {
        return 40 + d.dy / 2;
      }
    })
    .attr("text-anchor", "middle")
    .attr("font-size", function (d, i) {
      if (i <= 4) {
        return "1.4em"
      }
      return "0";
    })
    .attr("opacity", 0)
    .text(function (d) { return d.size + " companies"; });

  });

  /*******
  /***** END OF TREEMAP
  ******/  

  /*------------------------------------------------------------------*/

  /*******
  /***** START OF CHART FOR TOP 10 VALUABLE COMPANIES
  ******/
    var circles = g.selectAll(".circle")
    .data(top10Data)
    .enter()
    .append("g");

    circles.append("circle")
    .attr("class", "top")
    .attr("cx", function (d) { return +d.cx; })
    .attr("cy", function (d) { return +d.cy; })
    .attr("r", 0);
    //.attr("fill", "darkred");

    circles.append("text")
    .attr("class", "top-text")
    .attr("x", function (d, i) { 
      return d.cx;
    })
    .attr("y", function (d, i) {
      if (i < 3) {
          return height * .28;
        } else if (i < 6) {
          return height * .57;
        } else if (i < 9) {
          return height * .82;
        } else {
          return height;
        }
    })
    .attr("text-anchor", "middle")
    .attr("opacity", 0)
    .text(function (d) {
      return d.company + ": $" + d.valuation + " bn"; 
    });

    /*******
    /***** END OF CHART FOR TOP 10 UNICORNS
    ******/

  /*------------------------------------------------------------------*/

    /*******
    /***** START OF CHART UNICORNS BY COUNTRY
    ******/

    // Legend for country color chart
    var legend = g.selectAll(".legend")
    .data(d3.range(0,3))
    .enter()
    .append("g");

    legend.append("rect")
    .attr("class", "legend")
    .attr("x", function (d, i) {
      return (width / 2) + (i * 120);
    })
    .attr("y", height - 40)
    .attr("width", 0)
    .attr("height", 0);

    legend.append("text")
    .attr("class", "legend-text")
    .attr("x", function (d, i) {
      return (width / 2) + (i * 120);
    })
    .attr("y", height - 44)
    .attr("dx", "1.2em")
    .text(function (d, i) { return countries[i]; })
    .attr("opacity", 0);
  
    /*******
    /***** END OF CHART FOR UNICORNS BY COUNTRY
    ******/

  /*------------------------------------------------------------------*/

    /*******
    /***** START OF CHART FOR FASTEST CHART
    ******/

    d3.csv("data/data.csv", function (error, csv) {
      if (error) throw error;

      var asiaList = ["India", "China", "Israel", "Singapore", "South Korea"];

      csv = csv.slice(0,10);
      console.log(csv)

      fast = g.selectAll(".fast")
      .data(csv).enter()
      .append("g");

      fast.append("rect")
      .attr("class", "fast")
      //.attr("id", function (d) { return d.country; })
      .attr("x", 10)
      .attr("y", function (d, i) { return i * 60; })
      .attr("height", 40)
      .attr("width", 0)
      .attr("fill", "steelblue");

      fast.append("text")
      .attr("class", "fast-text")
      .attr("x", function (d) { return xFastScale(d.year_uni); })
      .attr("y", function (d, i) { return i * 60 + 25; })
      .attr("font-size", "1.3em")
      .attr("text-anchor", "end")
      .attr("fill", "white")
      .attr("opacity", 0)
      .text(function(d) {return d.company; });
    });

  /*------------------------------------------------------------------*/

    /*******
    /***** START OF CHART FOR ASIAN UNICORN BY INDUSTRY
    ******/

    var indBar = g.selectAll(".bar")
    .data(asiaInd)
    .enter()
    .append("g");

    indBar.append("rect")
    .attr("class", "bar")
    .attr("x", 10)
    .attr("y", function (d) { return yIndScale(d.key); })
    .attr("width", 0)
    .attr("height", yIndScale.rangeBand())
    .attr("fill", "steelblue");

    indBar.append("text")
    .attr("class", "bar-text")
    .attr("x", function (d) {
      if (xIndScale(d.values.length) > 240) {
        return xIndScale(d.values.length) - 200;
      }
      return xIndScale(d.values.length) + 20;
    })
    .attr("y", function (d) { return yIndScale(d.key); })
    .attr("dy", "1.8em")
    .attr("fill", function (d) {
      if (xIndScale(d.values.length) > 240) {
        return "#fff";
      }
      return "#3f3f3f";
    })
    .text(function (d) { return d.key; });

    /*******
    /***** END OF CHART FOR ASIAN UNICORN BY INDUSTRY
    ******/

  };  


  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  setupSections = function() {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showTitle;
    activateFunctions[1] = showFillerTitle;
    activateFunctions[2] = showTree;
    activateFunctions[3] = showTop;
    activateFunctions[4] = showCountryColor;
    activateFunctions[5] = showFast;
    activateFunctions[6] = showFastColor;
    activateFunctions[7] = showBar;
    // activateFunctions[8] = showHistAll;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for(var i = 0; i < 9; i++) {
      updateFunctions[i] = function() {};
    }

    // updateFunctions[3] = updateTop;
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */

   function showTitle() {

    g.selectAll(".count-title")
    .transition()
    .duration(600)
    .attr("opacity", 1);

    g.selectAll(".value-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-sub")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".tree")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".tree-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".tree-num")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr("r", 0);

    g.selectAll(".top-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".legend")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".legend-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".bar")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".bar-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".fast")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".fast-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

  }

  /**
   * showFillerTitle - filler counts
   *
   * hides: intro title
   * hides: square grid
   * shows: filler count title
   *
   */
  function showFillerTitle() {
    hideAxis();
    g.selectAll(".openvis-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".count-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-title")
    .transition()
    .duration(600)
    .attr("opacity", 1.0);

    g.selectAll(".value-sub")
    .transition()
    .duration(600)
    .attr("opacity", 1.0);

    g.selectAll(".tree")
    .transition()
    .attr("height", 0)
    .attr("width", 0);

    g.selectAll(".tree-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".tree-num")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr("r", 0);

    g.selectAll(".top-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".legend")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".legend-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".bar")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".bar-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".fast")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".fast-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);
  }

  function showTree() {
    hideAxis();

    g.selectAll(".count-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-sub")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr('width', 0);

    g.selectAll(".tree")
    .transition()
    .duration(600)
    .attr("width", function(d) { return d.dx; })
    .attr("height", function(d) { return d.dy; });

    g.selectAll(".tree-text")
    .transition()
    .duration(600)
    .attr("opacity", 1);

    g.selectAll(".tree-num")
    .transition()
    .duration(600)
    .attr("opacity", 1);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr("r", 0);

    g.selectAll(".top-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".legend")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".legend-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".bar")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".bar-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".fast")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".fast-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);
  }

  function showTop() {
    hideAxis();
    //showAxis(xTopAxis);

    g.selectAll(".count-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".tree")
    .transition()
    .duration(600)
    .attr("height", 0)
    .attr("width", 0);

    g.selectAll(".tree-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".tree-num")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr("r", function (d) { return circleScale(d.valuation); })
    .attr("fill", "darkred");

    g.selectAll(".top-text")
    .transition()
    .duration(600)
    .attr("opacity", 1);

    g.selectAll(".legend")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".legend-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".bar")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".bar-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".fast")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".fast-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);
  }

  function showCountryColor() {
    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr("r", function (d) { return circleScale(d.valuation); })
    .attr("fill", function (d) { return countryColor(d.country); })

    g.selectAll(".top-text")
    .transition()
    .duration(600)
    .attr("opacity", 1);

    g.selectAll(".legend")
    .transition()
    .duration(600)
    .attr("width", 82)
    .attr("height", 40)
    .attr("fill", function (d, i) { return countryColor(countries[i]); });

    g.selectAll(".legend-text")
    .transition()
    .duration(600)
    .attr("opacity", 1);

    g.selectAll(".bar")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".bar-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.select(".x.axis")
    .style("opacity", 0);

    g.selectAll(".fast")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".fast-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);
  }

  function showFast() {
    hideAxis();
    showAxis(xFastAxis);
    
    g.selectAll(".count-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-sub")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr('width', 0);

    g.selectAll(".tree")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".tree-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".tree-num")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr("r", 0);

    g.selectAll(".top-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".legend")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".legend-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".bar")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".bar-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.select("#x-label")
    .attr("dx", ".6em")
    .attr("dy", "3em")
    .transition()
    .duration(600)
    .text("Number of years");

    g.selectAll(".fast")
    .transition()
    .duration(600)
    .attr("id", function (d) { return null; })
    .attr("width", function (d) { return xFastScale(+d.year_uni); });

    g.selectAll(".fast-text")
    .transition()
    .duration(600)
    .attr("opacity", 1);
  }

  function showFastColor() {
    hideAxis();
    showAxis(xFastAxis);
    
    g.selectAll(".count-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-sub")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr('width', 0);

    g.selectAll(".tree")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".tree-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".tree-num")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr("r", 0);

    g.selectAll(".top-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".legend")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".legend-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".bar")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".bar-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.select("#x-label")
    .attr("dx", ".6em")
    .attr("dy", "3em")
    .transition()
    .duration(600)
    .text("Number of years");

    g.selectAll(".fast")
    .transition()
    .duration(600)
    .attr("id", function (d) { return d.country.replace(" ", "-"); })
    .attr("width", function (d) { return xFastScale(+d.year_uni); });

    g.selectAll(".fast-text")
    .transition()
    .duration(600)
    .attr("opacity", 1);
  }

  function showBar() {
    showAxis(xIndAxis);
    
    g.selectAll(".count-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-title")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".value-sub")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr('width', 0);

    g.selectAll(".tree")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".tree-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".tree-num")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".top")
    .transition()
    .duration(600)
    .attr("r", 0);

    g.selectAll(".top-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".legend")
    .transition()
    .duration(600)
    .attr("width", 0)
    .attr("height", 0);

    g.selectAll(".legend-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);

    g.selectAll(".bar")
    .transition()
    .duration(600)
    .attr("width", function (d) { return xIndScale(d.values.length); });

    g.selectAll(".bar-text")
    .transition()
    .duration(600)
    .attr("opacity", 1);

     g.select("#x-label")
    .attr("dx", ".6em")
    .attr("dy", "3em")
    .transition()
    .duration(600)
    .text("Number of companies");

    g.selectAll(".fast")
    .transition()
    .duration(600)
    .attr("width", 0);

    g.selectAll(".fast-text")
    .transition()
    .duration(600)
    .attr("opacity", 0);
  }

  
  function showAxis(axis) {
    g.select(".x.axis")
    .call(axis)
    .transition().duration(500)
    .style("opacity", 1);
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis() {
    g.select(".x.axis")
    .transition().duration(500)
    .style("opacity",0);
  }

  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */

  function getIndData(inData) {
    var processedData = d3.nest()
    .key( function (d) { return d.industry; })
    .entries(inData);

    return processedData;
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function(index) {
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function(i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function(index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
  return chart;
};


/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(data) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  d3.select("#vis")
    .datum(data)
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function(index) {
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity',  function(d,i) { return i == index ? 1 : 0.1; });

    // activate current section
    plot.activate(index);
  });

  scroll.on('progress', function(index, progress){
    plot.update(index, progress);
  });
}

// load data and display
d3.csv("data/unicorns.csv", display);