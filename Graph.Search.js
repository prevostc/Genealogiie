(function(Graph) {
    /**
     * Instansiate a new search object
     * @param {Graph} graph
     * @constructor
     */
    Graph.Search = function(graph) {
        this.graph = graph;
    };

    Graph.Search.prototype.fetchNodes = function() {

    };

    /*
        =========================
        =====      API      =====
        =========================

        s = new Graph.Search(graph);
        OR
        s = graph.search();
        =========================
        s.recursivity(1)
            .match(function(node){
                return node.id() === 'bla' || node.label() === 'bla'
            });
        OR
        s.recursivity(1)
            .match('bla');
        =========================
        var nodes = s.nodes();
        var links = s.links();
        =========================
        Graph.Search.strategies.default = Graph.Search.strategies.lowerCase;
        Graph.Search.strategies.lowerCase = (function(value) {
            value = value.lowerCase();
            return function(node){
                return node.label().lowerCase() === value
            }
        }
     */
})(Graph);