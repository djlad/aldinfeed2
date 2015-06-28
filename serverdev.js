var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require("mongoose");
var fs = require("fs");
var url = require("url");

function addPost(postObj,type,socket,time){
	//mongoose add post to data base
	console.log("adding text post");
	var np = new posts();
	np.content = postObj.content;
	np.date = type !== "file"?Date.now():time;
	np.type = type;
	np.save(function(){
		posts.find({},function(error,postArray){
			socket.broadcast.emit("updateTextPosts",[np]);
		})
	
	});
}

mongoose.connect("mongodb://localhost/aldinfeed");

//models
mongoose.model("posts",{content:String,date:Number,type:String});

var posts = mongoose.model("posts");

app.get('/', function(req, res){
	res.sendfile("bsdev.html");
});

app.get("/uploads",function(req,res){
	res.sendfile("uploads/"+url.parse(req.url, true).query.img);
})

io.on('connection', function(socket){
		console.log('a user connected');

		socket.on("getData",function(data){
			posts.find({},function(error,postArray){
				socket.emit("updateTextPosts",postArray);
			})
		});

		socket.on("newTextPost",function(obj){
			addPost(obj,"text",socket)
		});

		socket.on("newLinkPost",function(obj){
			addPost(obj,"link",socket);
		});

		/*socket.on("newFilePost",function(obj){
			console.log("adding file post to database");
			addPost(obj,"file",socket);
		});*/

		socket.on("getUploadedFile",function(file){
			time = Date.now();
			fileData = new Buffer(file[0],"base64");
			fs.writeFile("uploads/"+time,fileData,function(err){
				console.log(err)
				console.log("file uploaded (hopefully)");
			})
			addPost(file[1],"file",socket,time);
		});
});


http.listen(3000, function(){
	  console.log('listening on *:3000');
});
