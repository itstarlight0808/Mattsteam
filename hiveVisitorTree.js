var back_list = [];

var margin = {top: 80, right: 120, bottom: 80, left: 120},  width, heigh;
var max_depth;
var bubble_option = {
    width : 170,
    height : 55,
    offset_x : -120,
    offset_y : -20,
    margin : 240
}
var i = 0, duration = 550;
var svg, tree, root;
var max_node, node_x;
var diagonal = d3.svg.diagonal()
                     .projection(function(d) { return [d.y, d.x]; });
$(document).ready(()=>{
    getTreeData(seid);

    function update(source) {
        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);
        // Normalize for fixed-depth.
        nodes.forEach(function(d) { 
            d.y = d.depth * bubble_option.margin+100; 
            if(d.seid==root.seid){
                d.x = 45;
            }
        });
        max_node = {x : 0, depth : 0};
        node_x = [];
        reArrangeNodePosition(root);
        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });
        svg.selectAll("text.toggleBtn").text(function(d){
            if(d.children)
                return '-';
            else if(d._children)
                return '+';
            return '';
        });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", clickNode);

        nodeEnter.append("rect")
            .attr("rx", 5).attr("ry", 5)
            .attr("x", bubble_option.offset_x).attr("y", bubble_option.offset_y)
            .attr("width", 0).attr("height", bubble_option.height)
            .style("fill", function(d) { return d._children ? "transparent" : "transparent"; });
        nodeEnter.append('a')
                .attr('xlink:href', function(d){
                    if(d.seid==-1)
                    return "#";
                    return "./consensi.php?seid="+d.seid;
                })
                 .append('text')
                 .attr('x', 10).attr('y', 25)
                 .text("#").style("fill-opacity", 1e-6);
        nodeEnter.append('text')
                 .attr('class', 'toggleBtn')
                 .attr('x', 30).attr('y', 28)
                 .text(function(d){
                     if(d.children)
                        return '-';
                     if(d._children)
                        return '+';
                     return '';
                 }).style('fill-opacity', 1e-6).on('click', clickToggleButton)
        nodeEnter.append("text")
            .attr("x", function(d) { return 0; })
            .attr("dy", "-0.35em")
            .attr("text-anchor", function(d) { return "start"; })
            .each(function(d) {
                var cutpos = d.name.indexOf("(")<20?d.name.indexOf("("):20;
                var sub_text = d.name.substring(0,cutpos)+"...("+d.seid+")";
                sub_text = sub_text.split(' ');
                var i=rows=0;
                var temp = "";
                while(i<sub_text.length){
                    if(!sub_text[i]){ i++; continue;}
                    if(temp.length+sub_text[i].length>40){
                        d3.select(this).append("tspan")
                        .text(temp)
                        .attr("dy", (rows?1.2:0)+"em")
                        .attr("x", bubble_option.offset_x+5)
                        temp = sub_text[i]+(sub_text[i]=='.'?'':' ');
                        rows++;
                    }
                    else
                        temp+=sub_text[i]+(sub_text[i]=='.'?'':' ');
                    i++;
                }
                if(temp){
                    d3.select(this).append("tspan")
                    .text(temp)
                    .attr("dy", (rows?1.2:0)+"em")
                    .attr("x", bubble_option.offset_x+5)
                }
            })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("rect")
            .attr("width", bubble_option.width).attr("height", bubble_option.height)
            .style("fill", function(d) { return d._children ? "transparent" : "transparent"; });
        nodeUpdate.selectAll("a")
                  .style('fill-opacity', 1);
        nodeUpdate.selectAll("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(0)
            .attr("transform", function(d) { return "translate(" + (source.y+130) + "," + source.x + ")"; })
            .remove();

        nodeExit.select("rect")
            .attr("width", 0);
        nodeExit.selectAll('a')
                .style('fill-opacity', 1e-6);
        nodeExit.selectAll("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0+130};                
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration-50)
            .attr("d", function(d) {
                let source = {...d.source}
                source.y += 50;
                let target = {...d.target}
                target.y -= 120;
                return diagonal({source: source, target: target})
            });

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(0)
            .attr("d", function(d) {
                var o = {x: source.x, y: source.y+130};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
    function getTreeData(seid){
        $.ajax({
            url : "./hivetree_api.php"+(seid?"?seid="+seid:''),
            type : 'post',
            success : function(res, state) {
                if (!state) throw state;
                res = JSON.parse(res);
                // adjusting the size of svg element...
                max_depth = res.max_depth;

                d3.select("#container").html("");
                tree = d3.layout.tree()
                            .size([height="900", width=max_depth*300]);
                svg = d3.select("#container").append("svg")
                            .attr("width", width + margin.right + margin.left)
                            .attr("height", height + margin.top + margin.bottom)
                            .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                d3.select(self.frameElement).style("height", "800px");
                // creating a d3 tree...
                root = res.data;
                root.x0 = 100;
                root.y0 = 0;
    
    //            root.children.forEach(collapse);
                update(root);
                resizeD3Tree();
            }
        });
    }
    function clickNode(d){
        if(d.seid==-1)
            return;
        getTreeData(d.seid);
        back_list.push(root.seid);
    }
    d3.select("#backBtn").on('click',function(){
        if(!back_list.length) return;
        getTreeData(back_list.pop());
    })
    d3.select("#ExpandAllBtn").on('click', function(){
        expand(root);
        update(root);
        resizeD3Tree();
    })
    d3.select("#CollapseAllBtn").on('click', function(){
        if(root.children){
            root._children = root.children;
            root.children = null;
        }
        update(root);
        resizeD3Tree();
    })
    function expand(d){
        if(d._children){
            d.children = d._children;
            d._children = null;
        }
        if(d.children)
            d.children.forEach(expand);
    }
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }
    // Toggle children on click.
    function clickToggleButton(d) {
        if (d.children) {
            collapse(d);
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
        resizeD3Tree();
        d3.event.stopPropagation();
    }
    function resizeD3Tree(){
        max_depth = 1;
        getMaxRows(root);
        tree.size([height=max_node.x+200, width=max_depth*300]);
        d3.select("#container svg")
            .attr('width',width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom);
    }
    function getMaxRows(d){
        if(d.children)
            d.children.forEach(getMaxRows);
        max_depth = max_depth>d.depth?max_depth:d.depth;
    }
    function reArrangeNodePosition(d){
        if(d.children){
            d.children.forEach(reArrangeNodePosition);
            d.x = d.children[0].x;
        }
        else{
            
            if(d.depth<=max_node.depth && node_x[d.depth]){
                var lastnode = node_x[d.depth].lastnode;
                var f = 0;
                if(lastnode.children){
                    var cur_children = [...d.parent.children];
                    if(lastnode.parent.seid == d.parent.seid){
                        var index = d.parent.children.indexOf(lastnode);
                        cur_children = cur_children.slice(index+1);
                    }
                    for(var i=0;i<cur_children.length;i++){
                        var sibling = cur_children[i];
                        if(sibling.children || lastnode.children.length-1==i){
                            f=1;
                            break;
                        }
                    }
                }
                if(f)
                    d.x = lastnode.x + (lastnode.children.length - i)*(bubble_option.height+10);
                else
                    d.x = lastnode.x + (bubble_option.height+10)
                for(var i=d.depth-1;i>=1;i--){
                    if(!node_x[i])
                        continue;
                    if(node_x[i].lastnode.x>=d.x)
                        d.x = node_x[i].lastnode.x+(bubble_option.height+10);
                }
            }
            else{
                 max_node = { 'x' : max_node.x+bubble_option.height+10, depth : d.depth};
                 d.x = max_node.x;
            }
        }
        // console.log("current_node", d, "\nlast_node", node_x[d.depth], "\nmax_node", max_node);
        max_node = max_node.x<d.x || (max_node.x==d.x && max_node.depth>d.depth)?{'x' : d.x, depth : d.depth}:max_node;
        node_x[d.depth] = {'lastnode' : d};
        // console.log("last node", node_x[d.depth]);
    }
})
