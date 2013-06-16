var Graph = (function() {

    /********************************************/
    /*****              NODES               *****/
    /********************************************/

    /**
     * A graph node
     * @param {Graph} graph The node is in this graph
     * @param {string} label The node label, this string may be displayed
     * @param {string|number} [id] The node unique identifier. Defaults to label if not provided.
     * @constructor
     */
    function Node(graph, label, id) {
        id = id || label;
        /**
         * The node unique identifier
         * @protected
         * @type {String|Number}
         */
        this._id = id;

        /**
         * The node label, this string may be displayed
         * @protected
         * @type {String}
         */
        this._label = label;

        /**
         * The node is in this graph
         * @type {Graph}
         */
        this._graph = graph;

        /**
         * List of nodes to witch a link points to
         * @type {Object}
         * @private
         */
        this._next = {};

        /**
         * List of nodes from which a link spawns
         * @type {Object}
         * @private
         */
        this._prev = {};
    }

    /**
     * True id a link goes from node to this, false otherwise
     * @param {Node} node
     * @return {Boolean}
     */
    Node.prototype.follows = function (node) {
        return !!this.graph()._linksHashMap[this.graph()._linkHashFunc(node, this)];
    };

    /**
     * True id a link goes from this to node, false otherwise
     * @param {Node} node
     * @return {Boolean}
     */
    Node.prototype.precedes = function (node) {
        return !!this.graph()._linksHashMap[this.graph()._linkHashFunc(this, node)];
    };

    /**
     * True if a link connect this and node (link direction does not matters)
     * @param {Node} node
     * @return {Boolean}
     */
    Node.prototype.isConnected = function (node) {
        return this.follows(node) || this.precedes(node);
    };

    /**
     * True if node is the same semantic node as this
     * @param {Node} node
     * @return {Boolean}
     */
    Node.prototype.equals = function (node) {
        return this === node;
    };

    /**
     * true if the node matches the query
     * @param {Object} query
     * @return {Boolean}
     */
    Node.prototype.match = function (query) {
        query.token = query.token.toLocaleLowerCase();
        var match =(this.label().toLocaleLowerCase().indexOf(query.token) !== -1)
            || (this.id().toLocaleLowerCase().indexOf(query.token) !== -1);

        if (!match && !!query.recursive) {
            query.recursive = query.recursive - 1;
            var nodeId;
            for (nodeId in this._next) {
                if (this._next[nodeId].match(query)) {
                    match = true;
                    break;
                }
            }
            if (!match) {
                for (nodeId in this._prev) {
                    if (this._prev[nodeId].match(query)) {
                        match = true;
                        break;
                    }
                }
            }
            query.recursive = query.recursive + 1;
        }
        return match;
    };

    /**
     * @return {String}
     */
    Node.prototype.id = function () {
        return this._id;
    };

    /**
     * @return {Graph}
     */
    Node.prototype.graph = function () {
        return this._graph;
    };

    /**
     * Get or set the node label
     * @param {String} [label] If provided,set the node label
     * @return {String|Node}
     */
    Node.prototype.label = function (label) {
        if (!arguments.length) return this._label;
        this._label = label;
        return this;
    };

    /**
     * Add a next node
     * @param {Node} node
     * @return {Node} Chaining
     */
    Node.prototype.setNext = function (node) {
        this._next[node.id()] = node;
        return this;
    };

    /**
     * Add a previous node
     * @param {Node} node
     * @return {Node} Chaining
     */
    Node.prototype.setPrev = function (node) {
        this._prev[node.id()] = node;
        return this;
    };

    /********************************************/
    /*****              GRAPH               *****/
    /********************************************/

    /**
     * Directed Graph data structure
     * @constructor
     */
    function Graph() {
        /**
         * List of the graph nodes.
         * The object key is the node identifier
         * @protected
         * @type {Object}
         */
        this.nodes = {};

        /**
         * Typical D3 link: {source: 'Me', target: 'Mom', value: 5}
         * @protected
         * @type {Object[]}
         */
        this.links = [];

        /**
         * The keys of this objects is a hash of two node ids A and B
         * The value is the number of links that goes from A to B
         * @type {Object}
         * @protected
         */
        this._linksHashMap = {};
    }

    /**
     * Hash two Nodes in order to generate a unique key
     * @param {Node} source Source Node
     * @param {Node} target Target Node
     * @return {String} The hash of A and B
     * @protected
     */
    Graph.prototype._linkHashFunc = function (source, target) {
        return source.id() + ',' + target.id();
    };

    /**
     * Set a node on the graph, overwrite if exists
     * @param {String} label The node label, this string may be displayed
     * @param {String|Number} [id] The node unique identifier. Defaults to label if not provided.
     * @return {Graph} Chaining
     */
    Graph.prototype.setNode = function (label, id) {
        var node = new Node(this, label, id);
        this.nodes[node.id()] = node;
        return this;
    };

    /**
     * Find a node by his id
     * @param {String|Number} id The node unique identifier
     * @return {Node}
     */
    Graph.prototype.getNode = function (id) {
        return this.nodes[id];
    };

    /**
     * Return all nodes
     * @param {String} [query] Search string
     * @return {Object}
     */
    Graph.prototype.getAllNodes = function(query) {
        if (query === undefined || query === '' || query === null) {
            return this.nodes;
        }
        var nodes = {};
        for (var id in this.nodes) {
            if (this.nodes[id].match(query)) {
                nodes[id] = this.nodes[id];
            }
        }
        return nodes;
    };

    /**
     * Return the list of all links
     * @param {String} [query] Search string
     * @return {Object[]}
     */
    Graph.prototype.getAllLinks = function (query) {
        if (query === undefined || query === '' || query === null) {
            return this.links;
        }
        var links = [];
        for (var index = 0, length = this.links.length; index < length ; index ++) {
            if (this.links[index].source.match(query) && this.links[index].target.match(query)) {
                links.push(this.links[index]);
            }
        }
        return links;
    };

    /**
     * Return the node count
     * @return {Number}
     */
    Graph.prototype.getNodeCount = function() {
        return Object.keys(this.nodes).length;
    };

    /**
     * Set a node display name
     * @param {String|Number} id The node unique identifier
     * @param {String} label The node label, this string may be displayed
     * @return {Graph} Chaining
     */
    Graph.prototype.setNodeLabel = function (id, label) {
        if(this.nodeExists(id)) {
            this.nodes[id].label(label);
        }
        return this;
    };

    /**
     * True if the node with id identifier have already been set
     * @param {String|Number} id The node unique identifier
     * @return {Boolean}
     */
    Graph.prototype.nodeExists = function (id) {
        return !!this.nodes[id];
    };

    /**
     * Create a link between two nodes, create nodes if needed
     * @param {String} src The source id
     * @param {String} trg The target id
     * @return {Graph} Chaining
     */
    Graph.prototype.addLink = function (src, trg) {
        // add nodes if not exists
        if (!this.nodeExists(src)) {
            this.setNode(src);
        }
        if (!this.nodeExists(trg)) {
            this.setNode(trg);
        }

        // retrieve created nodes
        var source = this.getNode(src),
            target = this.getNode(trg);

        // add link to the link pool
        this.links.push({
            source: source,
            target: target,
            value: 1
        });

        // set next and prev references
        source.setNext(target);
        target.setPrev(source);

        // add link count between those two
        var hashKey = this._linkHashFunc(source, target);
        this._linksHashMap[hashKey] = (this._linksHashMap[hashKey])
            ? this._linksHashMap[hashKey] + 1
            : 1;

        return this;
    };

 return Graph;
})();