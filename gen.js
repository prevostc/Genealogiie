var Genealogy = (function() {

    var _circle,
        _path,
        _text,
        _svg,
        _options = {
            dotId: 'dot',
            graphId: 'graph',
            nodeSize: 4,
            debug: false,
            width: 800,
            height: 600,
            boxed: true,
            labels: true,
            boxPadding: 30,
            searchRecursivity: 1,
            // force directed layout parameters
            charge: -30,
            friction: .9,
            gravity: .1
        };

    /**
     * Genealogy drawing class
     * @constructor
     */
    function Genealogy(options) {
        /**
         * @type {Graph} The genealogy graph data structure
         */
        this.graph = undefined;

        // merge with param
        options = options || {};
        for (var propName in _options) {
            if (_options.hasOwnProperty(propName) && options.hasOwnProperty(propName)) {
                _options[propName] = options[propName];
            }
        }
    }

    Genealogy.prototype.charge = function(value) {
        if (!arguments.length) return this._force.charge();
        _options.charge = value;
        this._force.charge(value).start();
        return this;
    };

    Genealogy.prototype.labels = function(value) {
        if (!arguments.length) return _options.labels;
        _options.labels = value;
        _text.classed('hidden', function(){return !_options.labels});
        return this;
    };

    Genealogy.prototype.boxed = function(value) {
        if (!arguments.length) return _options.boxed;
        _options.boxed = value;
        return this;
    };

    Genealogy.prototype.boxPadding = function(value) {
        if (!arguments.length) return _options.boxPadding;
        _options.boxPadding = value;
        return this;
    };

    Genealogy.prototype.searchRecursivity = function(value) {
        if (!arguments.length) return _options.searchRecursivity;
        _options.searchRecursivity = value;
        return this;
    };

    Genealogy.prototype.filter = function(query) {
        query = {
            token: query,
            recursive: _options.searchRecursivity
        };
        var nodes = d3.values(this.graph.getAllNodes(query));
        var links = this.graph.getAllLinks(query);
        this._force.links(links).nodes(nodes).start();
        this.draw();
    };


    /**
     * Fetch data from the options.dotId element and create the graph structure
     * @return {Genealogy} Chaining
     */
    Genealogy.prototype.init = function() {
        var dotString = this._getDotString();
        this.graph = this._dot2Graph(dotString);
        if (this._force) {
            this._force.stop();
            document.getElementById(_options.graphId).innerHTML = '';
        }
        this._force = d3.layout.force()
            .nodes(d3.values(this.graph.getAllNodes()))
            .links(this.graph.getAllLinks())
            .size([_options.width, _options.height])
            .charge(_options.charge)
            .friction(_options.friction)
            .gravity(_options.gravity)
            .on("tick", tick);
        return this;
    };

    /**
     * Draw the graph using this.graph and _options
     * @return {Genealogy} Chaining
     */
    Genealogy.prototype.draw = function() {
        if (!this.graph) {
            return this;
        }

        this.empty();

		var _this = this;

        _this._force
			.start();

        // main svg
		_svg = d3.select("#" + _options.graphId)
            .append("svg:svg")
			.attr("width", _options.width)
			.attr("height", _options.height);

        // link arrow def (associated with css)
		_svg.append("svg:defs").selectAll("marker")
			.data(["godparent"])
		  .enter()
            .append("svg:marker")
			.attr("id", String)
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 15)
			.attr("refY", -1.5)
			.attr("markerWidth", _options.nodeSize)
			.attr("markerHeight", _options.nodeSize)
			.attr("orient", "auto")
		  .append("svg:path")
			.attr("d", "M0,-5L10,0L0,5");

        // links
		_path = _svg.append("svg:g")
            .selectAll(".link")
			.data(_this._force.links(), function(d) { return d.target.graph()._linkHashFunc(d.source, d.target); });
        _path.enter()
            .append("line")
            .attr("class", "link");
        _path.exit()
            .remove();

        // nodes
		_circle = _svg.append("svg:g")
            .selectAll(".node")
			.data(_this._force.nodes(), function(d) {return d.id();});
		_circle.enter()
            .append("svg:circle")
            .attr("class", "node")
            .attr("r", _options.nodeSize)
            .call(_this._force.drag)
            .on("mouseover", fade())
            .on("mouseout", unfade());
        _circle.exit()
            .remove();

        // labels
		_text = _svg.append("svg:g")
            .selectAll(".node")
			.data(_this._force.nodes(), function(d) {return d.id();});
        _text.enter()
            .append("svg:text")
            .attr("x", _options.nodeSize + 1)
            .attr("y", ".31em")
            .attr("class", "text")
            .classed('hidden', function(){return !_options.labels})
            .text(function(d) {return d.label();});
        _text.exit()
            .remove();


        return this;
	};
	
	
	Genealogy.prototype._dot2Graph = function(dotString) {
		var g = new Graph(),
            lines = dotString.split('\n'),
			line = '',
			length = lines.length,
			i = 0,
			matches = [],
			rYear = /^{ rank = same; (\d\d\d\d) ([^}]+)}$/i, 
			rLabel= /^([0-9a-zA-Z\u00E0-\u00FC_-]+)\s+\[label="([0-9a-zA-Z\u00E0-\u00FC'^@ _-]+)"\];?$/i,
			rLink = /^\s*"?([0-9a-zA-Z\u00E0-\u00FC_-]+)"?\s+->\s+"?([0-9a-zA-Z\u00E0-\u00FC _-]+)"?(?:\s*\[.*?\])?;?$/i,
			debug = _options.debug;
		
		for ( ; i < length ; i++) {
			line = lines[i].trim();
			if (matches = rLink.exec(line)) {
				g.addLink(matches[1], matches[2]);
			} else if (matches = rLabel.exec(line)) {
                g.setNodeLabel(matches[1], matches[2]);
			} else if (matches = rYear.exec(line)) {
				console.log('Yes', line, matches[2].split(' '));
			} else {
				console.log('No', line, matches);
			}
			
			if (debug && g.getNodeCount() > 100) {
				break;
			}
		}

        return g;
	};
	
	
	Genealogy.prototype._getDotString = function() {
		var el = document.getElementById(_options.dotId);
		if (el.innerText) {
			return el.innerText
		} else {
			return el.textContent;
		}
	};

    Genealogy.prototype.empty = function() {
        var el = document.getElementById(_options.graphId);
        el.innerHTML = '';
    };


    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/^\s+/g, '').replace(/\s+$/g, '');
        };
    }

    function unfade() {
        return function() {
            _svg.selectAll(".link")
                .classed('selected', false)
                .classed('faded', false);
            _svg.selectAll(".node")
                .classed('selected', false)
                .classed('faded', false)
                .classed('godparent', false)
                .classed('godchild', false);
            _svg.selectAll(".text")
                .classed('selected', false)
                .classed('faded', false);
        }
    }

    function fade() {
        return function(d) {
            var isPathConnected = function(p, d) {
                return p.source.equals(d) || p.target.equals(d);
            };
            _svg.selectAll(".node")
                .classed("selected", function(dd) {return d.equals(dd) || d.isConnected(dd);})
                .classed("godparent", function(dd) {return d.precedes(dd);})
                .classed("godchild", function(dd) {return d.follows(dd);})
                .classed("faded", function(dd) {return !(d.equals(dd) || d.isConnected(dd));});
            _svg.selectAll(".text")
                .classed("selected", function(dd) {return d.equals(dd) || d.isConnected(dd);})
                .classed("faded", function(dd) {return !(d.equals(dd) || d.isConnected(dd));});
            _svg.selectAll(".link")
                .classed("selected", function(dd) {return isPathConnected(dd, d);})
                .classed("faded", function(dd) {return !isPathConnected(dd, d);});
        }
    }

    function tick() {
        if (_options.boxed) {
            _circle
                .attr("cx", function(d) {
                    return d.x = Math.max(_options.boxPadding, Math.min(_options.width - _options.boxPadding, d.x));
                })
                .attr("cy", function(d) {
                    return d.y = Math.max(_options.boxPadding, Math.min(_options.height - _options.boxPadding, d.y));
                });
        }
        _svg.selectAll(".node")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        _path.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        _text.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }

    return Genealogy;

})();