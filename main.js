
var gen;

function main() {

    var repulsionControl = document.getElementById('repulsionControl');
    var repulsionValue = document.getElementById('repulsionValue');
    var repulsionMin = parseInt(repulsionControl.getAttribute('min'));
    var repulsionMax = parseInt(repulsionControl.getAttribute('max'));
    function applyRepulsion(value) {
        repulsionValue.innerHTML = value;
        gen.charge(-value);
    }
    repulsionControl.onchange = function() {applyRepulsion(parseInt(this.value));};

    var labelsControl = document.getElementById('labelsControl');
    labelsControl.onchange = function() {
        gen.labels(this.checked);
    };

    var boxedControl = document.getElementById('boxedControl');
    boxedControl.onchange = function() {
        gen.boxed(this.checked);
    };

    var searchControl = document.getElementById('searchControl');
    function applySearch() {
        var query = (searchControl.value === '') ? undefined : searchControl.value;
        gen.filter(query);
    }

    searchControl.onkeyup = function() {
        applySearch();
    };
    searchControl.onsearch = function() {
        applySearch();
    };

    var searchRecursivityControl = document.getElementById('searchRecursivityControl');
    searchRecursivityControl.onchange = function() {
        gen.searchRecursivity(parseInt(this.value));
        applySearch();
    };

    document.onmousewheel = function moveObject(event)
    {
        var delta = 0,
            velocity = 10;

        // normalize the data
        if (!event) event = window.event;
        if (event.wheelDelta) { // IE and Opera
            delta = event.wheelDelta / 60;
        } else if (event.detail) { // W3C
            delta = -event.detail / 2;
        }

        // process new repulsion
        var repulsion = parseInt(repulsionControl.value) + delta*velocity;
        repulsion = Math.min(repulsionMax, repulsion);
        repulsion = Math.max(repulsionMin, repulsion);

        // apply repulsion
        repulsionControl.value = repulsion;
        applyRepulsion(repulsion);
    }

    gen = new Genealogy({
        width: window.innerWidth - 300,
        height: window.innerHeight - 25
    });
    gen.init().draw();
}