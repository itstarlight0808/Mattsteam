'use strict';

var chart;
var root, max_depth, max_usercount, children_depth = {} , total_ch_count;
var switchmode = 0;
var scale = 1;
d3.chart = d3.chart || {};

d3.chart.architectureTree = function() {

    var svg, tree, treeData, diameter, activeNode;
    var svg_position={
        x0 : screen.width/2,
        y0 : screen.height/2
    }
    $(window).click(function(e){
        if(!activeNode)
            return;
        fade(1)(activeNode);
        $(".detail-panel").hide();
        activeNode = null;
    });
    // Define the zoom function for the zoomable tree
    function zoom() {
        scale = d3.event.scale;
        d3.event.translate[0]+=svg_position.x0*d3.event.scale;
        d3.event.translate[1]+=svg_position.y0*d3.event.scale;
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        chart();
    }
    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);
    /**
     * Build the chart
     */
    function chart(){
        if (typeof(tree) === 'undefined') {
            tree = d3.layout.tree()
                 .separation(function(a, b) { 
                     return (a.parent == b.parent ? 1 : 2) / (!a.depth?1:a.depth); 
                    });

            svg = d3.select("#container").append("svg")
                .call(zoomListener)
                .attr("width", "100%")
                .attr("height", "100%" )
                .attr('xmlns:xlink', "http://www.w3.org/1999/xlink")
                .append("g")
                .attr("transform", "translate(" + svg_position.x0 + "," + svg_position.y0 + ")");
        }
        tree.size([360, diameter / 2]);

        var nodes = tree.nodes(treeData),
            links = tree.links(nodes);

        activeNode = null;

        svg.call(updateData, nodes, links);
    }
    /**
     * Update the chart data
     * @param {Object} container
     * @param {Array}  nodes
     */
    var updateData = function(container, nodes, links) {

        // Enrich data
        
        var diagonal = d3.svg.diagonal.radial()
            .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

        var linkSelection = svg.selectAll(".link").data(links, function(d) {
            return d.source.name + d.target.name + Math.random();
        });
        linkSelection.exit().remove();

        linkSelection.enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal);

        var nodeSelection = container.selectAll(".node").data(nodes, function(d) {
            return d.name + Math.random();  // always update node
        });
        nodeSelection.exit().remove();

        var node = nodeSelection.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
            .on('mouseover', function(d) {
                if(activeNode) return;
                fade(0.1)(d);
                $(".title").html(d.name);
                var temp_userlist = d.userlist.map((one)=>{
                    return "<div class='user'>"+one.name+"</div>";
                });
                if(!temp_userlist.length)
                  temp_userlist = [];
                $(".user-container").html("").append(temp_userlist.join(' '));
                $(".detail-panel").show();
            })
            .on('mouseout', function(d) {
                if(activeNode) {
                    return;
                }
                fade(1)(d);
                $(".detail-panel").hide();
            })
            .on('click', function(d) {
                activeNode = d;
                d3.event.stopPropagation();

                location.search= "seid="+d.seid;
            });
        node.append("circle")
            .attr("r", function(d) {
                if(!switchmode)
                    return d.userlist.length>0?20:5;
                else
                    return d.userlist.length>0?0:5;
            })
            .attr('transform', ()=>{
                if(scale<1)
                    return "scale("+(1.0/scale)+")";
            })
            .style('stroke', function(d) {
                return d3.scale.linear()
                    .domain([0, 1])
                    .range(["white", "green"])(0.8);
            })
            .style('fill', function(d) {
                var user_range = 5*2;
                var color = 0xFF03E7-Math.ceil(1.0*d.userlist.length/user_range)*999;
                if(color<0) color = -color;
                var value = Math.ceil((d.userlist.length%user_range)/5)/2;
                if(value==0 && d.userlist.length) value=1;
                return d3.scale.linear().domain([0,1]).
                        range(["white", "#"+color.toString(16)])(value);
            })
        node.append('text')
            .attr('y', 10)
            .attr('text-anchor', 'middle')
            .text(function(d){
                return d.userlist.length>0?d.userlist.length:"";
            })
            .attr('transform', (d)=>("rotate(-"+(d.x-90)+")"))
            .style('fill', 'black')
            .style('font-size', "1.5em");
        node.append("image")
            .attr('x', -15).attr('y', -15)
            .attr('width', 30)
            .attr('height', 30)
            .attr("xlink:href", "./images/eye20.png")
            .attr('transform', (d)=>{ return "rotate("+(-d.x+90)+")"; })
            .style('display', (d)=>{
                if(switchmode && d.userlist.length>0)
                    return 'block';
                return 'none';
            })
        node.append("text")
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? "translate(18)" : "rotate(180)translate(-18)"; })
            .text(function(d) {
                return "("+d.seid+")";
            });
    };
     var fade = function(opacity) {
        return function(node) {
            //if (!node.dependsOn || !(node.parent && node.parent.dependsOn)) return;
            svg.selectAll(".node")
                .filter(function(d) {
                    if (d.name === node.name) return false;
                    return true;
                })
                .transition()
                .style("opacity", opacity);
        };
    };
    chart.data = function(value) {
        if (!arguments.length) return treeData;
        treeData = value;
        return chart;
    };

    chart.diameter = function(value) {
        if (!arguments.length) return diameter;
        diameter = value;
        return chart;
    };

    return chart;
};

$(document).ready(function(){

    getNodes();
    setInterval(getNodes, 30000);
    $("#switchViewBtn").click(()=>{
        switchmode = (switchmode+1)%2;
        chart();
    });
})

function getNodes(){
    $.ajax({
        url : "./hivetree_api0.php"+(seid?"?seid="+seid:''),
        type : 'post',
        success : function(res, state) {
            if (!state) throw state;
            res = JSON.parse(res);
            // adjusting the size of svg element...
            max_depth = res.max_depth;
            max_usercount = res.max_usercount;
            // d3.select("#container").html("");
            // tree = d3.layout.tree()
            //             .size([height="900", width=max_depth*550]);
            // svg = d3.select("#container").append("svg")
            //             .attr("width", width + margin.right + margin.left)
            //             .attr("height", height + margin.top + margin.bottom)
            //             .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
            //             .append("g")
            //             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            // d3.select(self.frameElement).style("height", "800px");
            // creating a d3 tree...
            root = res.data;
            children_depth = {};
            total_ch_count = 0;
            var max_children={count : 1, depth : 0};
            getChildrenCountByDepth(root, 0);
            for(var key in children_depth){
                max_children.count = max_children.count>children_depth[key]?max_children.count:children_depth[key];
                max_children.depth = key;
            }
            if(!chart)
                chart = d3.chart.architectureTree();
            chart.data(root);
            var diameter = total_ch_count*40.0;
            diameter = diameter<800?800:diameter;
            chart.diameter(diameter);
            chart();
        }
    });
}
function getChildrenCountByDepth(node , depth){
    if(!children_depth[depth])
        children_depth[depth] = 0;
    if(node.children)
        node.children.forEach((one)=>{ getChildrenCountByDepth(one, depth+1); })
    else
        total_ch_count++;
    children_depth[depth]++;
}