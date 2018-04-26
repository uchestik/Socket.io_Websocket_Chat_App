const mongoose = require('mongoose');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cors = require('cors');

app.use(cors())

server.listen(5000);

//connect to mongodb native driver
mongoose.connect('mongodb://localhost:27017/mongoChat', function(err,db){
    if(err){
        console.log(err);
    }
    console.log('connected');

    // connect to socket.io
    io.on('connection', function(socket){
        //create connection
        let chat = db.collection('chat');

        //create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        //get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
            if(err){
                throw err;
            }

            //emit messages
            socket.emit('output',res)
        })

        //handle input events - client event uses on event
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            //check for name and message
            if(name == '' || message == ''){
                sendStatus('Please enter a name and message')
            }else{
                //insert message
                chat.insert({name:name,message:message}, function(){
                    socket.emit('output', [data]);
                    //send status object
                    sendStatus({
                        message:'Message Sent',
                        clear:true
                    })
                })
            }
        })

        //handle clear
        socket.on('clear', function(data){
            //remove all chats from collection
            chat.remove({}, function(){
                socket.emit('cleared')
            })
        })




    })
});
