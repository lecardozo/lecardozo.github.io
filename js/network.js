
var nodes, edges, network, options, nodenum, freq;

function drawNet(){
	// create an empty array for nodes
	nodes = new vis.DataSet([]);
	
	// create an empty array for edges
	edges = new vis.DataSet([]);

	// create a network
	var container = document.getElementById('mynetwork');
	var data = {
		nodes: nodes,
		edges: edges
	};
	
	// network options
	options = {
		edges:{
			smooth:{
				enabled:false
			},
			physics:false
		},
		layout:{
			hierarchical: false,
		},
		interaction:{
			tooltipDelay: 200,
			hover: true,
			hoverConnectedEdges: true,
		},
		nodes:{
			shape: "dot",
		},
		autoResize: true,
		height: '100%',
		width: '100%',
		
	};
	network = new vis.Network(container, data, options);
}
	
	
	
	
// random network
function randNet(){
	edges.clear();
	nodes.clear();
	
	nodenum =  parseInt(document.getElementById("nnodes").value);
	freq =  parseFloat(document.getElementById("pcon").value);

	var G = new jsnx.Graph();
	
	// add nodes
	for(var i=1; i <= nodenum; i++){
		nodes.add({id: i, label: i.toString(), edgenum: 0, title: "Connections: " + 0,  color: "#f2f2f2", value:0});
		G.addNode(i);
	}
	
	edgeid = 0;
	
	// add edges
	for(var i=1 ; i <= nodenum; i++){
		for (var j=i+1; j <= nodenum; j++){
			var r = Math.random(1);
			if (r < freq){
				edgeid++;
				edges.add({from: i, to: j, id: edgeid});
				G.addEdge(i,j);
				auxi = nodes.get(i).edgenum + 1;
				auxj = nodes.get(j).edgenum + 1;
				nodes.update({id: i, label: i.toString(), edgenum: auxi , title: "Connections: " + auxi, value: auxi});
				nodes.update({id: j, label: j.toString(), edgenum: auxj , title: "Connections: " + auxj, value: auxj});
			}
		}
	}
	
	var avcon = 0;
	var maxedge = 0;
	var minedge = 1000;
	
	for(var i=1; i <= nodenum; i++){
		aux = nodes.get(i).edgenum;
		avcon = avcon + aux;
		if(aux > maxedge){maxedge = aux;}
		if(aux < minedge){minedge = aux;}
	}
	
	avcon = parseFloat((avcon/(nodenum)).toFixed(2));
	shortpaths = jsnx.allPairsShortestPathLength(G);
	allshortpaths = [];
	shortpaths.forEach(function(item, key, mapObj) {
			item.forEach(function(x, y, z){
				allshortpaths.push(x);				
			})
	})
	allshortpaths = allshortpaths.filter(Number);
	sum = allshortpaths.reduce((a, b) => a + b, 0);
	meanshortpath = parseFloat((sum/allshortpaths.length).toFixed(2));
	
	document.getElementById("statnn").innerHTML = nodenum;
	document.getElementById("staten").innerHTML = edges.length;
	document.getElementById("statac").innerHTML = avcon;
	document.getElementById("statmaxc").innerHTML = maxedge;
	document.getElementById("statminc").innerHTML = minedge;
	document.getElementById("statshort").innerHTML =  meanshortpath;
	document.getElementById("stats").style.visibility = "visible"
	

}
	

	
	// preferential attachment network
function prefAttNet(){
	edges.clear();
	nodes.clear();
	
	var G = new jsnx.Graph();
	
	nodenum =  parseInt(document.getElementById("nnodes").value);
	freq =  parseFloat(document.getElementById("pcon").value);
	addnode =  parseInt(document.getElementById("addnode").value);
	addedge =  parseInt(document.getElementById("addedge").value);
	
	// add nodes
	for(var i=1; i <= nodenum; i++){
		nodes.add({id: i, label: i.toString(), edgenum: 0, title: "Connections: " + 0, color: "#f2f2f2", value: 0});
		G.addNode(i);
	}
	
	edgeid = 0;
	// add edges
	for(var i=1 ; i <= nodenum; i++){
		for (var j=i+1; j <= nodenum; j++){
			var r = Math.random(1);
			if (r < freq){
				edgeid++;
				edges.add({from: i, to: j, id: edgeid});
				G.addEdge(i,j);
				auxi = nodes.get(i).edgenum + 1;
				auxj = nodes.get(j).edgenum + 1;
				nodes.update({id: i, label: i.toString(), edgenum: auxi , value: auxi, title: "Connections: " + auxi, color: "#f2f2f2", value: auxi});
				nodes.update({id: j, label: j.toString(), edgenum: auxj , value: auxj, title: "Connections: " + auxj, color: "#f2f2f2", value: auxj});
			}
		}
	}
	
	// add edges preferentially 
	for(var z=1; z <= addnode; z++){
		var newnode = nodenum + z;
		nodes.add({id: newnode, label: newnode.toString(), edgenum: 0, value: 0, title: "Connections: " + 0, color: "#99ffeb"});
		var links = 0;
		for(var i=1; i <= nodes.length; i++){
			//nodes.update({id: newnode, label: newnode.toString(), edgenum: 0 , value: 0, title: "Connections: " + auxj, color: "#99ffeb"});
			if(testLink(nodes.get(i).edgenum) == 1){
				if(links < addedge){
					links++;
					edgeid++;
					edges.add({from: newnode, to: i, id: edgeid});
					G.addEdge(newnode,i);
					auxi = nodes.get(i).edgenum + 1;
					auxj = nodes.get(newnode).edgenum + 1;
					nodes.update({id: i, label: i.toString(), edgenum: auxi , value: auxi, title: "Connections: " + auxi});
					nodes.update({id: newnode, label: newnode.toString(), edgenum: auxj , value: auxj, title: "Connections: " + auxj, color: "#99ffeb"});
				}
			} 
		}
		
	}
	
	var avcon = 0;
	var maxedge = 0;
	var minedge = 1000;
	
	for(var i=1; i <= nodenum; i++){
		aux = nodes.get(i).edgenum;
		avcon = avcon + aux;
		if(aux > maxedge){maxedge = aux;}
		if(aux < minedge){minedge = aux;}
	}
	
	avcon = parseFloat((avcon/(nodenum+addnode)).toFixed(2));
	shortpaths = jsnx.allPairsShortestPathLength(G);
	allshortpaths = [];
	shortpaths.forEach(function(item, key, mapObj) {
			item.forEach(function(x, y, z){
				allshortpaths.push(x);				
			})
	})
	allshortpaths = allshortpaths.filter(Number);
	sum = allshortpaths.reduce((a, b) => a + b, 0);
	meanshortpath = parseFloat((sum/allshortpaths.length).toFixed(2));
	
	
	document.getElementById("statnn").innerHTML = nodenum+addnode;
	document.getElementById("staten").innerHTML = edges.length;
	document.getElementById("statac").innerHTML = avcon;
	document.getElementById("statmaxc").innerHTML = maxedge;
	document.getElementById("statminc").innerHTML = minedge;
	document.getElementById("statshort").innerHTML =  meanshortpath;
	document.getElementById("stats").style.visibility = "visible"
	
	
}


function testLink(num){
	for(i=1; i <= num; i++){
		var r = Math.random(1);
		if(r < freq){
			return(1);
		}
	}
}
